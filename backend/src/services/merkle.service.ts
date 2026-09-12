import crypto from 'crypto';

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
   * Builds a balanced SHA-256 Merkle tree from an array of leaves and returns the Merkle root.
   */
  public static computeMerkleRoot(leaves: string[]): string {
    if (!leaves || leaves.length === 0) {
      return '0x' + '0'.repeat(64);
    }

    // Convert hex strings to Buffers
    let currentLevel: Buffer[] = leaves.map(leaf => {
      const clean = leaf.startsWith('0x') ? leaf.slice(2) : leaf;
      return Buffer.from(clean.padStart(64, '0'), 'hex');
    });

    // Pairwise hashing up to the root
    while (currentLevel.length > 1) {
      const nextLevel: Buffer[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          // Sort pair for deterministic canonical tree
          const [left, right] = Buffer.compare(currentLevel[i], currentLevel[i + 1]) <= 0
            ? [currentLevel[i], currentLevel[i + 1]]
            : [currentLevel[i + 1], currentLevel[i]];
          nextLevel.push(this.sha256(Buffer.concat([left, right])));
        } else {
          // Odd leaf: hash with itself
          nextLevel.push(this.sha256(Buffer.concat([currentLevel[i], currentLevel[i]])));
        }
      }
      currentLevel = nextLevel;
    }

    return '0x' + currentLevel[0].toString('hex');
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
