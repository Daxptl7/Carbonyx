import crypto from 'crypto';

export interface MerkleTreeResult {
  merkleRoot: string;
  leaves: string[];
  leafCount: number;
}

export class MerkleService {
  /**
   * Computes SHA-256 hash of two child hashes concatenated
   */
  private static hashPair(left: string, right: string): string {
    const cleanLeft = left.startsWith('0x') ? left.slice(2) : left;
    const cleanRight = right.startsWith('0x') ? right.slice(2) : right;
    
    // Sort pair for deterministic canonical Merkle Tree
    const combined = cleanLeft < cleanRight ? cleanLeft + cleanRight : cleanRight + cleanLeft;
    const hash = crypto.createHash('sha256').update(Buffer.from(combined, 'hex')).digest('hex');
    return `0x${hash}`;
  }

  /**
   * Computes a full SHA-256 Merkle Tree from an array of leaf payload hashes
   */
  public static computeMerkleTree(payloadHashes: string[]): MerkleTreeResult {
    if (!payloadHashes || payloadHashes.length === 0) {
      throw new Error('Cannot compute Merkle tree with 0 leaves');
    }

    const leaves = payloadHashes.map(h => (h.startsWith('0x') ? h : `0x${h}`));
    let currentLevel = [...leaves];

    // Iteratively hash pairs until the root is reached
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i + 1]));
        } else {
          // Odd leaf: duplicate or carry over
          nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i]));
        }
      }

      currentLevel = nextLevel;
    }

    return {
      merkleRoot: currentLevel[0],
      leaves,
      leafCount: leaves.length
    };
  }
}
