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
    
    pub fn initialize_game(ctx: Context<InitializeGame>, name: String) -> Result<()> {
        instructions::initialize_game(ctx, name)
    }
    
    pub fn update_game(
        ctx: Context<UpdateGame>, 
        new_name: String,
        wallet_address: Pubkey,
        total_max_players: u32,
        date_game: i32
    ) -> Result<()> {
        instructions::update_game(
            ctx, 
            new_name,
            wallet_address,
            total_max_players,
            date_game
        )
    }
    
    pub fn initialize_player(ctx: Context<InitializePlayer>, name: String) -> Result<()> {
        instructions::initialize_player(ctx, name)
    }
    
    pub fn register_player(
        ctx: Context<RegisterPlayer>, 
        name: String
    ) -> Result<()> {
        instructions::register_player(
            ctx, 
            name
        )
    }
    
    pub fn update_player(
        ctx: Context<UpdatePlayer>, 
        new_name: String,
        nb_games: u32,
    ) -> Result<()> {
        instructions::update_player(
            ctx, 
            new_name, 
            nb_games
        )
    }

}
