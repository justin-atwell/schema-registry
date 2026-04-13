import { createHash } from "crypto";

// A single field in a schema definition
// Think of this as a strongly-typed DTO
export interface SchemaField {
  index: number;
  name: string;
  fieldType: FieldType;
  required: boolean;
}

export enum FieldType {
  U64 = 0,
  I64 = 1,
  Pubkey = 2,
  String = 3,
  Bool = 4,
  Bytes = 5,
}

// Hash a single field into a leaf node
// leaf = SHA256(index_le16 || name_bytes || field_type_byte || required_byte)
export function hashLeaf(field: SchemaField): Buffer {
  const indexBuf = Buffer.alloc(2);
  indexBuf.writeUInt16LE(field.index);

  const nameBuf = Buffer.alloc(32);
  Buffer.from(field.name).copy(nameBuf);

  const typeBuf = Buffer.alloc(1);
  typeBuf.writeUInt8(field.fieldType);

  const requiredBuf = Buffer.alloc(1);
  requiredBuf.writeUInt8(field.required ? 1 : 0);

  const combined = Buffer.concat([indexBuf, nameBuf, typeBuf, requiredBuf]);
  return createHash("sha256").update(combined).digest();
}

// Hash two child nodes together into a parent node
function hashPair(left: Buffer, right: Buffer): Buffer {
  return createHash("sha256").update(Buffer.concat([left, right])).digest();
}

// Pad the leaves array to the next power of 2
// This keeps the tree balanced and deterministic
function padToPowerOfTwo(leaves: Buffer[]): Buffer[] {
  const ZERO_LEAF = Buffer.alloc(32, 0);
  let size = 1;
  while (size < leaves.length) size *= 2;
  const padded = [...leaves];
  while (padded.length < size) padded.push(ZERO_LEAF);
  return padded;
}

// Build the full Merkle tree and return the root
// This is what gets stored on-chain as the trust anchor
export function computeMerkleRoot(fields: SchemaField[]): Buffer {
  if (fields.length === 0) {
    return Buffer.alloc(32, 0);
  }

  let layer = padToPowerOfTwo(fields.map(hashLeaf));

  // Walk up the tree combining pairs until we reach the root
  // Think of this like a tournament bracket
  while (layer.length > 1) {
    const nextLayer: Buffer[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      nextLayer.push(hashPair(layer[i], layer[i + 1]));
    }
    layer = nextLayer;
  }

  return layer[0];
}

// Verify a blob's fields match an on-chain Merkle root
// This is what an AI agent or institutional consumer calls
// before trusting any field definitions
export function verifySchema(
  fields: SchemaField[],
  onChainRoot: number[]
): boolean {
  const computedRoot = computeMerkleRoot(fields);
  const onChainRootBuf = Buffer.from(onChainRoot);
  return computedRoot.equals(onChainRootBuf);
}

// The two demo scenarios — pre-defined field sets
export const ETF_SCHEMA: SchemaField[] = [
  { index: 0, name: "nav_per_share",     fieldType: FieldType.U64,    required: true  },
  { index: 1, name: "underlying_assets", fieldType: FieldType.String,  required: true  },
  { index: 2, name: "settlement_date",   fieldType: FieldType.I64,    required: true  },
  { index: 3, name: "issuer_pubkey",     fieldType: FieldType.Pubkey, required: true  },
  { index: 4, name: "expense_ratio",     fieldType: FieldType.U64,    required: false },
  { index: 5, name: "shares_outstanding",fieldType: FieldType.U64,    required: true  },
];

export const SUPPLY_CHAIN_SCHEMA: SchemaField[] = [
  { index: 0, name: "product_id",      fieldType: FieldType.String,  required: true  },
  { index: 1, name: "gs1_gtin",        fieldType: FieldType.String,  required: true  },
  { index: 2, name: "custody_event",   fieldType: FieldType.String,  required: true  },
  { index: 3, name: "location_hash",   fieldType: FieldType.Bytes,   required: true  },
  { index: 4, name: "timestamp",       fieldType: FieldType.I64,     required: true  },
  { index: 5, name: "handler_pubkey",  fieldType: FieldType.Pubkey,  required: false },
];