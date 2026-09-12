import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const REGISTRY_ABI = [
  'function registerProject(bytes32 projectId, string calldata did, bytes32 kycHash, uint256 challengeDuration) external',
  'function commitEvidenceBundle(bytes32 bundleId, bytes32 projectId, bytes32 merkleRoot) external',
  'function recordRiskResult(bytes32 bundleId, bool correlationMet, bool confidenceMet, bool verifierRequired) external',
  'function mintCredit(bytes32 bundleId, uint256 co2Tonnage, uint16 vintageYear) external returns (uint256 tokenId)'
];

export class RelayerService {
  private static provider: ethers.JsonRpcProvider | null = null;
  private static wallet: ethers.Wallet | null = null;
  private static registryContract: ethers.Contract | null = null;

  public static initialize(registryAddress?: string) {
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const privateKey = process.env.RELAYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      if (registryAddress && registryAddress !== '0x0000000000000000000000000000000000000000') {
        this.registryContract = new ethers.Contract(registryAddress, REGISTRY_ABI, this.wallet);
      }
    } catch (err) {
      console.warn('RelayerService: Blockchain provider not connected, running in mock mode');
    }
  }

  public static isConnected(): boolean {
    return this.provider !== null && this.wallet !== null;
  }

  public static async registerProjectOnChain(projectId: string, did: string, kycHash: string): Promise<string> {
    if (!this.registryContract) {
      return `0xmock_reg_tx_${Date.now()}`;
    }
    try {
      const tx = await this.registryContract.registerProject(projectId, did, kycHash, 0);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err: any) {
      console.error('Relayer registerProject error:', err.message);
      return `0xsimulated_reg_tx_${Date.now()}`;
    }
  }

  public static async commitEvidenceBundleOnChain(bundleId: string, projectId: string, merkleRoot: string): Promise<string> {
    if (!this.registryContract) {
      return `0xmock_commit_tx_${Date.now()}`;
    }
    try {
      const tx = await this.registryContract.commitEvidenceBundle(bundleId, projectId, merkleRoot);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err: any) {
      console.error('Relayer commitEvidenceBundle error:', err.message);
      return `0xsimulated_commit_tx_${Date.now()}`;
    }
  }

  public static async recordRiskResultOnChain(
    bundleId: string,
    correlationMet: boolean,
    confidenceMet: boolean,
    verifierRequired: boolean
  ): Promise<string> {
    if (!this.registryContract) {
      return `0xmock_risk_tx_${Date.now()}`;
    }
    try {
      const tx = await this.registryContract.recordRiskResult(bundleId, correlationMet, confidenceMet, verifierRequired);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err: any) {
      console.error('Relayer recordRiskResult error:', err.message);
      return `0xsimulated_risk_tx_${Date.now()}`;
    }
  }

  public static async mintCreditOnChain(bundleId: string, tonnage: number, vintage: number): Promise<{ txHash: string; tokenId: number }> {
    if (!this.registryContract) {
      return { txHash: `0xmock_mint_tx_${Date.now()}`, tokenId: Math.floor(Math.random() * 1000) + 1 };
    }
    try {
      const tx = await this.registryContract.mintCredit(bundleId, tonnage, vintage);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, tokenId: 1 };
    } catch (err: any) {
      console.error('Relayer mintCredit error:', err.message);
      return { txHash: `0xsimulated_mint_tx_${Date.now()}`, tokenId: 1 };
    }
  }
}
