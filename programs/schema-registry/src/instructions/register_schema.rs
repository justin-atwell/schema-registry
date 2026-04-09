use anchor_lang::prelude::*;
use crate::state::{RegistryConfig, SchemaRecord};

pub fn handler(
    ctx: Context<RegisterSchema>,
    namespace: [u8; 32],
    merkle_root: [u8; 32],
    fields_cid: [u8; 59],
    version: u32,
) -> Result<()> {
    let config = &mut ctx.accounts.registry_config;
    let schema = &mut ctx.accounts.schema_record;

    // Assign the current count as the schema_id, then increment
    let assigned_id = config.schema_count;
    config.schema_count = config.schema_count.checked_add(1).unwrap();

    schema.authority = ctx.accounts.authority.key();
    schema.schema_id = assigned_id;
    schema.version = version;
    schema.namespace = namespace;
    schema.merkle_root = merkle_root;
    schema.fields_cid = fields_cid;
    schema.created_at = Clock::get()?.unix_timestamp;
    schema.deprecated = false;
    schema.successor_id = None;
    schema.bump = ctx.bumps.schema_record;

    Ok(())
}

#[derive(Accounts)]
pub struct RegisterSchema<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry_config.bump,
    )]
    pub registry_config: Account<'info, RegistryConfig>,

    #[account(
        init,
        payer = authority,
        space = SchemaRecord::LEN,
        seeds = [
            b"schema",
            authority.key().as_ref(),
            registry_config.schema_count.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub schema_record: Account<'info, SchemaRecord>,

    pub system_program: Program<'info, System>,
}