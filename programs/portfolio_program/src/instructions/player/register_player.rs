use anchor_lang::prelude::*;
use crate::state::Player;
use crate::constants::*;
use crate::errors::PlayerError;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterPlayer<'info> {
    #[account(
        init,
        payer = user,
        space = PLAYER_SIZE
    )]
    pub player: Account<'info, Player>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn register_player(ctx: Context<RegisterPlayer>, name: String) -> Result<()> {
    let player = &mut ctx.accounts.player;
    
    // Validate that name contains only letters and numbers
    if !name.chars().all(|c| c.is_alphanumeric()) {
        return err!(PlayerError::InvalidNameFormat);
    }
    
    // Validate name length
    if name.len() > NAME_LENGTH {
        return err!(PlayerError::NameTooLong);
    }
    
    // Initialize name field with zeros
    let mut name_bytes = [0u8; NAME_LENGTH];
    
    // Copy the name bytes to the fixed-size array
    name_bytes[..name.len()].copy_from_slice(name.as_bytes());
    
    // Set the player fields
    player.name = name_bytes;
    player.wallet_address = ctx.accounts.user.key();
    player.nb_games = 0;
    
    msg!("Player registered with name: {}", name);
    Ok(())
}