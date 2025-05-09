use anchor_lang::prelude::*;
use crate::state::Portfolio;
use crate::constants::*;
use crate::errors::PortfolioError;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializePortfolio<'info> {
    #[account(
        init,
        payer = user,
        space = PORTFOLIO_SIZE
    )]
    pub portfolio: Account<'info, Portfolio>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_portfolio(ctx: Context<InitializePortfolio>, name: String) -> Result<()> {
    let portfolio = &mut ctx.accounts.portfolio;
    
    // Validate that name contains only letters and numbers
    if !name.chars().all(|c| c.is_alphanumeric()) {
        return err!(PortfolioError::InvalidNameFormat);
    }
    
    // Validate name length
    if name.len() > NAME_LENGTH {
        return err!(PortfolioError::NameTooLong);
    }
    
    // Initialize name field with zeros
    let mut name_bytes = [0u8; NAME_LENGTH];
    
    // Copy the name bytes to the fixed-size array
    name_bytes[..name.len()].copy_from_slice(name.as_bytes());
    
    // Set the portfolio fields
    portfolio.name = name_bytes;
    portfolio.wallet_address = ctx.accounts.user.key();
    portfolio.nb_tokens = 0;
    portfolio.nb_transactions = 0;
    portfolio.amount_total_tokens = 0;
    portfolio.amount_total_value_stablecoin = 0;
    portfolio.date_portfolio = Clock::get()?.unix_timestamp as i32;
    
    msg!("Portfolio initialized with name: {}", name);
    Ok(())
}
