import crypto from 'crypto';
import { ethers } from 'ethers';

export class CryptographicService {
  /**
   * Generates a W3C-compliant DID for a project owner
   */
  public static generateDID(ownerAddress: string): string {
    const cleanAddress = ownerAddress.toLowerCase();
    return `did:carbonyx:${cleanAddress}`;
  }

  /**
   * Generates a deterministic SHA-256 hash of a JSON payload
   */
  public static hashPayload(payload: any): string {
    const canonicalString = typeof payload === 'string' ? payload : JSON.stringify(payload, Object.keys(payload).sort());
    const hash = crypto.createHash('sha256').update(canonicalString).digest('hex');
    return `0x${hash}`;
  }

  /**
   * Generates a bytes32 identifier from a string
   */
  public static toBytes32(text: string): string {
    if (text.startsWith('0x') && text.length === 66) {
      return text;
    }
    return ethers.keccak256(ethers.toUtf8Bytes(text));
  }
}
