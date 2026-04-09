use anchor_lang::prelude::*;
use crate::state::RegistryConfig;

pub fn handler(ctx: Context<Initialize>, fee_in_lamports: u64) -> Result<()> {
    let config = &mut ctx.accounts.registry_config;
    config.authority = ctx.accounts.authority.key();
    config.schema_count = 0;
    config.fee_in_lamports = fee_in_lamports;
    config.bump = ctx.bumps.registry_config;
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,                                    // create this account
        payer = authority,                       // authority pays rent
        space = RegistryConfig::LEN,             // allocate this many bytes
        seeds = [b"registry"],                   // PDA seed
        bump,                                    // Anchor finds the canonical bump
    )]
    pub registry_config: Account<'info, RegistryConfig>,

    pub system_program: Program<'info, System>,
}