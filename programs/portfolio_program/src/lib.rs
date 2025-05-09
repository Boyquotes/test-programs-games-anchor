use anchor_lang::prelude::*;
pub mod constants;
pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;
use errors::*;

declare_id!("GMjxqNihJ5HrjDPDufCc7f7bmTxuMyP4G7xmC1H3XvnV");

#[program]
pub mod portfolio_program {
    use super::*;

    pub fn initialize_portfolio(ctx: Context<InitializePortfolio>, name: String) -> Result<()> {
        instructions::initialize_portfolio(ctx, name)
    }
}
