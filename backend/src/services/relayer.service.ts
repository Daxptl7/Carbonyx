import { ethers } from 'ethers';
import contractsConfig from '../config/contracts.json';
import { CryptographicService } from './cryptographic.service';

export class RelayerService {
  private static provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
  private static wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    RelayerService.provider
  );

  private static registryContract = new ethers.Contract(
    contractsConfig.contracts.CarbonRegistry.address,
    contractsConfig.contracts.CarbonRegistry.abi,
    RelayerService.wallet
  );

  private static nftContract = new ethers.Contract(
    contractsConfig.contracts.CarbonCreditNFT.address,
    contractsConfig.contracts.CarbonCreditNFT.abi,
    RelayerService.wallet
  );

  private static currentNonce: number | null = null;

  private static async getFreshNonce(): Promise<number> {
    const onChainNonce = await this.provider.getTransactionCount(this.wallet.address, 'latest');
    if (this.currentNonce === null || onChainNonce > this.currentNonce) {
      this.currentNonce = onChainNonce;
    }
    const nonceToUse = this.currentNonce;
    this.currentNonce++;
    return nonceToUse;
  }

  /**
   * Registers a project on-chain in CarbonRegistry
   */
  public static async registerProject(
    projectId: string,
    did: string,
    kycHash: string = '0x' + '0'.repeat(64),
    challengeDuration: number = 86400
  ): Promise<string> {
    const bytesProjectId = CryptographicService.toBytes32(projectId);
    const nonce = await this.getFreshNonce();
    const tx = await this.registryContract.registerProject(
      bytesProjectId,
      did,
      kycHash,
      challengeDuration,
      { nonce }
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Commits an evidence bundle and its SHA-256 Merkle root to CarbonRegistry
   */
  public static async commitEvidenceBundle(
    bundleId: string,
    projectId: string,
    merkleRoot: string
  ): Promise<string> {
    const bytesBundleId = CryptographicService.toBytes32(bundleId);
    const bytesProjectId = CryptographicService.toBytes32(projectId);
    const bytesMerkleRoot = merkleRoot.startsWith('0x') && merkleRoot.length === 66
      ? merkleRoot
      : CryptographicService.toBytes32(merkleRoot);

    const nonce = await this.getFreshNonce();
    const tx = await this.registryContract.commitEvidenceBundle(
      bytesBundleId,
      bytesProjectId,
      bytesMerkleRoot,
      { nonce }
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Records the AI risk assessment results on-chain
   */
  public static async recordRiskResult(
    bundleId: string,
    correlationMet: boolean,
    confidenceMet: boolean,
    verifierRequired: boolean
  ): Promise<string> {
    const bytesBundleId = CryptographicService.toBytes32(bundleId);
    const nonce = await this.getFreshNonce();
    const tx = await this.registryContract.recordRiskResult(
      bytesBundleId,
      correlationMet,
      confidenceMet,
      verifierRequired,
      { nonce }
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Mints an ERC-721 Carbon Credit NFT on-chain
   */
  public static async mintCredit(
    bundleId: string,
    co2Tonnage: number,
    vintageYear: number = 2026
  ): Promise<{ txHash: string; tokenId: number }> {
    const bytesBundleId = CryptographicService.toBytes32(bundleId);
    const nonce = await this.getFreshNonce();
    const tx = await this.registryContract.mintCredit(
      bytesBundleId,
      Math.floor(co2Tonnage),
      vintageYear,
      { nonce }
    );
    const receipt = await tx.wait();

    // Extract tokenId from CreditIssued event
    let tokenId = 1;
    for (const log of receipt.logs) {
      try {
        const parsed = this.registryContract.interface.parseLog(log);
        if (parsed && parsed.name === 'CreditIssued') {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch {}
    }

    return { txHash: receipt.hash, tokenId };
  }
}
