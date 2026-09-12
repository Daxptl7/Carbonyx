import crypto from 'crypto';

export interface MerkleTreeResult {
  merkleRoot: string;
  leaves: string[];
  leafCount: number;
}

export interface MerkleLeaf {
  id?: string;
  sourceType: string;
  payload: any;
  payloadHash?: string;
}

export class MerkleService {
  /**
   * Computes SHA-256 hash of buffer/string
   */
  private static sha256(data: string | Buffer): Buffer {
    return crypto.createHash('sha256').update(data).digest();
  }

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
   * Hashes an evidence item into a 32-byte Merkle leaf
   */
  public static hashLeaf(item: MerkleLeaf): string {
    if (item.payloadHash) {
      return item.payloadHash.startsWith('0x') ? item.payloadHash : '0x' + item.payloadHash;
    }
    const serialized = typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload);
    return '0x' + crypto.createHash('sha256').update(serialized).digest('hex');
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

  /**
   * Builds a balanced SHA-256 Merkle tree from an array of leaves and returns the Merkle root.
   */
  public static computeMerkleRoot(leaves: string[]): string {
    if (!leaves || leaves.length === 0) {
      return '0x' + '0'.repeat(64);
    }
    return this.computeMerkleTree(leaves).merkleRoot;
  }

  /**
   * Generates a Merkle inclusion proof for a specific leaf index
   */
  public static generateProof(leaves: string[], leafIndex: number): string[] {
    if (leafIndex < 0 || leafIndex >= leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds`);
    }

    let currentLevel: Buffer[] = leaves.map(leaf => {
      const clean = leaf.startsWith('0x') ? leaf.slice(2) : leaf;
      return Buffer.from(clean.padStart(64, '0'), 'hex');
    });

    const proof: string[] = [];
    let idx = leafIndex;

    while (currentLevel.length > 1) {
      const nextLevel: Buffer[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          const isLeft = (idx === i);
          const isRight = (idx === i + 1);

          if (isLeft) {
            proof.push('0x' + currentLevel[i + 1].toString('hex'));
          } else if (isRight) {
            proof.push('0x' + currentLevel[i].toString('hex'));
          }

          const [left, right] = Buffer.compare(currentLevel[i], currentLevel[i + 1]) <= 0
            ? [currentLevel[i], currentLevel[i + 1]]
            : [currentLevel[i + 1], currentLevel[i]];
          nextLevel.push(this.sha256(Buffer.concat([left, right])));
        } else {
          if (idx === i) {
            proof.push('0x' + currentLevel[i].toString('hex'));
          }
          nextLevel.push(this.sha256(Buffer.concat([currentLevel[i], currentLevel[i]])));
        }
      }
      idx = Math.floor(idx / 2);
      currentLevel = nextLevel;
    }

    return proof;
  }
}
