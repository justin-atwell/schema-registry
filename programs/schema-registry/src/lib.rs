use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::initialize::*;
use instructions::register_schema::*;

declare_id!("64emq1duDiA3YCyyuZX8QZUDMPbk2iRqMU7H13BZP2nM");

#[program]
pub mod schema_registry {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_in_lamports: u64) -> Result<()> {
        instructions::initialize::handler(ctx, fee_in_lamports)
    }

    pub fn register_schema(
        ctx: Context<RegisterSchema>,
        namespace: [u8; 32],
        merkle_root: [u8; 32],
        fields_cid: [u8; 59],
        version: u32,
    ) -> Result<()> {
        instructions::register_schema::handler(ctx, namespace, merkle_root, fields_cid, version)
    }
}