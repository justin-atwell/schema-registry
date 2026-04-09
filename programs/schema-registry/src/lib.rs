use anchor_lang::prelude::*;

declare_id!("64emq1duDiA3YCyyuZX8QZUDMPbk2iRqMU7H13BZP2nM");

#[program]
pub mod schema_registry {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
