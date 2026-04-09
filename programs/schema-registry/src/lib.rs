use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::initialize::*;

declare_id!("64emq1duDiA3YCyyuZX8QZUDMPbk2iRqMU7H13BZP2nM");

#[program]
pub mod schema_registry {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_in_lamports: u64) -> Result<()> {
        instructions::initialize::handler(ctx, fee_in_lamports)
    }
}