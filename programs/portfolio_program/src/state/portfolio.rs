use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct Portfolio {
    // name: string max 50 characters with letters and numbers only
    pub name: [u8; NAME_LENGTH],
    
    // wallet_address: Public key of the portfolio owner
    pub wallet_address: Pubkey,
    
    // nb_tokens: Number of different tokens in the portfolio
    pub nb_tokens: u32,
    
    // nb_transactions: Number of transactions made in this portfolio
    pub nb_transactions: u32,
    
    // amount_total_tokens: Total number of tokens across all holdings
    pub amount_total_tokens: u32,
    
    // amount_total_value_stablecoin: Total value in stablecoin
    pub amount_total_value_stablecoin: u32,
    
    // date_portfolio: Creation date of the portfolio
    pub date_portfolio: i32,
}

impl Default for Portfolio {
    fn default() -> Self {
        Portfolio {
            name: [0u8; NAME_LENGTH],
            wallet_address: Pubkey::default(),
            nb_tokens: 0,
            nb_transactions: 0,
            amount_total_tokens: 0,
            amount_total_value_stablecoin: 0,
            date_portfolio: 0,
        }
    }
}
