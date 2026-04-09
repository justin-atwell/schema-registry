use anchor_lang::prelude::*;

#[account]
pub struct SchemaRecord {
    pub authority: Pubkey,          // who registered it
    pub schema_id: u64,             // assigned from registry_config.schema_count
    pub version: u32,               // semver major
    pub namespace: [u8; 32],        // e.g. "solana.schema.test"
    pub merkle_root: [u8; 32],      // cryptographic fingerprint of field definitions
    pub fields_cid: [u8; 59],       // IPFS/Arweave CID for full schema blob
    pub created_at: i64,            // unix timestamp
    pub deprecated: bool,
    pub successor_id: Option<u64>,  // points to replacement schema if deprecated
    pub bump: u8,
}

impl SchemaRecord {
    // 8   = Anchor discriminator
    // 32  = Pubkey authority
    // 8   = u64 schema_id
    // 4   = u32 version
    // 32  = [u8; 32] namespace
    // 32  = [u8; 32] merkle_root
    // 59  = [u8; 59] fields_cid
    // 8   = i64 created_at
    // 1   = bool deprecated
    // 9   = Option<u64> (1 byte discriminant + 8 bytes value)
    // 1   = u8 bump
    pub const LEN: usize = 8 + 32 + 8 + 4 + 32 + 32 + 59 + 8 + 1 + 9 + 1;
}