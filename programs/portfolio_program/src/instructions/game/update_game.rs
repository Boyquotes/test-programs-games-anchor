use anchor_lang::prelude::*;
use crate::state::Game;
use crate::constants::*;
use crate::errors::GameError;

#[derive(Accounts)]
pub struct UpdateGame<'info> {
    #[account(
        mut,
        constraint = game.wallet_address == user.key() @ GameError::NotGameOwner,
    )]
    pub game: Account<'info, Game>,
    
    #[account(mut)]
    pub user: Signer<'info>,
}

pub fn update_game(
    ctx: Context<UpdateGame>, 
    new_name: String,
    wallet_address: Pubkey,
    total_max_players: u32,
    date_game: i32
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    
    // Validate that name contains only letters and numbers
    if !new_name.chars().all(|c| c.is_alphanumeric()) {
        return err!(GameError::InvalidNameFormat);
    }
    
    // Validate name length
    if new_name.len() > NAME_LENGTH {
        return err!(GameError::NameTooLong);
    }
    
    // Create a byte array initialized with zeros, then copy the name into it
    let mut bytes_game_name = [0u8; NAME_LENGTH];
    bytes_game_name[..new_name.len()].copy_from_slice(new_name.as_bytes());
    
    // Update the game name
    game.name = bytes_game_name;
    
    // Update additional fields with the provided values
    game.wallet_address = wallet_address;
    game.total_max_players = total_max_players;
    game.date_game = date_game;
    
    msg!("Game updated with new name: {}", new_name);
    msg!("Game total_max_players: {}", game.total_max_players);
    Ok(())
}