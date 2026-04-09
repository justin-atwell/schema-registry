use anchor_lang::prelude::*;

#[account]
pub struct RegistryConfig {
    pub authority: Pubkey, //controller of the registry. who owns it
    pub schema_count: u64, //counter
    pub fee_in_lamports: u64, //cost to register a new schema
    pub bump: u8, //bump seed for security
}

impl RegistryConfig {
    // Anchor needs to know how many bytes to allocate for this account.
    // 8 = Anchor's discriminator (like a type tag prepended to every account)
    // 32 = Pubkey
    // 8 = u64 schema_count
    // 8 = u64 fee_in_lamports
    // 1 = u8 bump
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}