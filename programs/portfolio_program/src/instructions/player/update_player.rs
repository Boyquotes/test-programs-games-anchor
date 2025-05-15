use anchor_lang::prelude::*;
use crate::state::Player;
use crate::constants::*;
use crate::errors::PlayerError;

#[derive(Accounts)]
pub struct UpdatePlayer<'info> {
    #[account(
        mut,
        constraint = player.wallet_address == user.key() @ PlayerError::NotPlayerOwner,
    )]
    pub player: Account<'info, Player>,
    
    #[account(mut)]
    pub user: Signer<'info>,
}

pub fn update_player(
    ctx: Context<UpdatePlayer>, 
    new_name: String,
    nb_games: u32,
) -> Result<()> {
    let player = &mut ctx.accounts.player;
    
    // Validate that name contains only letters and numbers
    if !new_name.chars().all(|c| c.is_alphanumeric()) {
        return err!(PlayerError::InvalidNameFormat);
    }
    
    // Validate name length
    if new_name.len() > NAME_LENGTH {
        return err!(PlayerError::NameTooLong);
    }
    
    // Initialize name field with zeros
    let mut name_bytes = [0u8; NAME_LENGTH];
    
    // Copy the name bytes to the fixed-size array
    name_bytes[..new_name.len()].copy_from_slice(new_name.as_bytes());
    
    // Update the game name
    player.name = name_bytes;
    
    // Update additional fields with the provided values
    player.wallet_address = ctx.accounts.user.key();
    player.nb_games = nb_games;
    
    msg!("Player updated with new name: {}", new_name);
    msg!("Player token count: {}", player.nb_games);
    Ok(())
}