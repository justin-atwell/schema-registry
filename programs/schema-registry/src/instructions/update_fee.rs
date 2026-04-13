use anchor_lang::prelude::*;
use crate::state::RegistryConfig;
use crate::errors::RegistryError;

pub fn handler(ctx: Context<UpdateFee>, new_fee: u64) -> Result<()> {
    ctx.accounts.registry_config.fee_in_lamports = new_fee;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateFee<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry_config.bump,
        has_one = authority @ RegistryError::Unauthorized,
    )]
    pub registry_config: Account<'info, RegistryConfig>,
}