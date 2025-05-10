use anchor_lang::prelude::*;
use crate::state::Portfolio;
use crate::constants::*;
use crate::errors::PortfolioError;

#[derive(Accounts)]
pub struct UpdatePortfolio<'info> {
    #[account(
        mut,
        constraint = portfolio.wallet_address == user.key() @ PortfolioError::NotPortfolioOwner,
    )]
    pub portfolio: Account<'info, Portfolio>,
    
    #[account(mut)]
    pub user: Signer<'info>,
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
    let portfolio = &mut ctx.accounts.portfolio;
    
    // Validate that name contains only letters and numbers
    if !new_name.chars().all(|c| c.is_alphanumeric()) {
        return err!(PortfolioError::InvalidNameFormat);
    }
    
    // Validate name length
    if new_name.len() > NAME_LENGTH {
        return err!(PortfolioError::NameTooLong);
    }
    
    // Initialize name field with zeros
    let mut name_bytes = [0u8; NAME_LENGTH];
    
    // Copy the name bytes to the fixed-size array
    name_bytes[..new_name.len()].copy_from_slice(new_name.as_bytes());
    
    // Update the portfolio name
    portfolio.name = name_bytes;
    
    // Update additional fields with the provided values
    portfolio.wallet_address = ctx.accounts.user.key();
    portfolio.nb_tokens = nb_tokens;
    portfolio.nb_transactions = nb_transactions;
    portfolio.amount_total_tokens = amount_total_tokens;
    portfolio.amount_total_value_stablecoin = amount_total_value_stablecoin;
    portfolio.date_portfolio = date_portfolio;
    
    msg!("Portfolio updated with new name: {}", new_name);
    msg!("Portfolio token count: {}", portfolio.nb_tokens);
    Ok(())
}