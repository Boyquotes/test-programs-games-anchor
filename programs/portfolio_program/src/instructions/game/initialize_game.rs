use anchor_lang::prelude::*;
use crate::state::Game;
use crate::constants::*;
use crate::errors::GameError;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = user,
        space = PORTFOLIO_SIZE
    )]
    pub game: Account<'info, Game>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_game(ctx: Context<InitializeGame>, name: String) -> Result<()> {
    let game = &mut ctx.accounts.game;
    
    // Validate that name contains only letters and numbers
    if !name.chars().all(|c| c.is_alphanumeric()) {
        return err!(GameError::InvalidNameFormat);
    }
    
    // Validate name length
    if name.len() > NAME_LENGTH {
        return err!(GameError::NameTooLong);
    }
    
    // Create a byte array initialized with zeros, then copy the name into it
    let mut bytes_game_name = [0u8; NAME_LENGTH];
    bytes_game_name[..name.len()].copy_from_slice(name.as_bytes());
    
    // Set the game fields
    game.name = bytes_game_name;
    game.wallet_address = ctx.accounts.user.key();
    game.total_max_players = 0;
    game.date_game = Clock::get()?.unix_timestamp as i32;
    
    msg!("Game initialized with name: {}", name);
    Ok(())
}
