use anchor_lang::prelude::*;
use crate::state::SchemaRecord;
use crate::errors::RegistryError;

pub fn handler(ctx: Context<DeprecateSchema>, successor_id: Option<u64>) -> Result<()> {
    let schema = &mut ctx.accounts.schema_record;

    require!(!schema.deprecated, RegistryError::AlreadyDeprecated);

    schema.deprecated = true;
    schema.successor_id = successor_id;

    Ok(())
}

#[derive(Accounts)]
pub struct DeprecateSchema<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"schema",
            authority.key().as_ref(),
            schema_record.schema_id.to_le_bytes().as_ref(),
        ],
        bump = schema_record.bump,
        has_one = authority @ RegistryError::Unauthorized,
    )]
    pub schema_record: Account<'info, SchemaRecord>,
}