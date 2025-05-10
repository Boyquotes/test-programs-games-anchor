use anchor_lang::prelude::*;
pub mod constants;
pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

declare_id!("GMjxqNihJ5HrjDPDufCc7f7bmTxuMyP4G7xmC1H3XvnV");

#[program]
pub mod portfolio_program {
    use super::*;

    pub fn initialize_portfolio(ctx: Context<InitializePortfolio>, name: String) -> Result<()> {
        instructions::initialize_portfolio(ctx, name)
    }
    
    pub fn update_portfolio(
        ctx: Context<UpdatePortfolio>, 
        new_name: String,
        nb_tokens: u32,
        nb_transactions: u32,
        amount_total_tokens: u32,
        amount_total_value_stablecoin: u32,
        date_portfolio: i32
    ) -> Result<()> {
        instructions::update_portfolio(
            ctx, 
            new_name, 
            nb_tokens, 
            nb_transactions, 
            amount_total_tokens, 
            amount_total_value_stablecoin, 
            date_portfolio
        )
    }
}
