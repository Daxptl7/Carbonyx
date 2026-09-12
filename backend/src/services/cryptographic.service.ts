import crypto from 'crypto';
import { ethers } from 'ethers';

export class CryptographicService {
  /**
   * Generates a W3C-compliant decentralized identifier (DID) for a carbon project
   * Format: did:carbonyx:0x<hash>
   */
  public static generateProjectDID(projectId: string, ownerAddress: string): string {
    const raw = `${projectId.toLowerCase()}:${ownerAddress.toLowerCase()}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 40);
    return `did:carbonyx:0x${hash}`;
  }

  /**
   * Computes SHA-256 hash of a JSON payload
   */
  public static hashPayload(payload: any): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return '0x' + crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Computes bytes32 hex from any string ID (for Solidity bytes32 arguments)
   */
  public static toBytes32(str: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(str));
  }

  /**
   * Verifies an Ethereum signed message (EIP-191)
   */
  public static verifySignature(message: string, signature: string, expectedSigner: string): boolean {
    try {
      const recovered = ethers.verifyMessage(message, signature);
      return recovered.toLowerCase() === expectedSigner.toLowerCase();
    } catch {
      return false;
    }
  }
}
