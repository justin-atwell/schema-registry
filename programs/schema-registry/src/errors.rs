use anchor_lang::prelude::*;

#[error_code]
pub enum RegistryError {
    #[msg("Signer is not the schema authority")]
    Unauthorized,

    #[msg("Schema is already deprecated")]
    AlreadyDeprecated,
}