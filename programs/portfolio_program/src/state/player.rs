use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct Player {
    // name: string max 50 characters with letters and numbers only
    pub name: [u8; NAME_LENGTH],
    
    // wallet_address: Wallet address of the player
    pub wallet_address: Pubkey,
    
    // nb_games: Number of games played by the player
    pub nb_games: u32,
}

impl Default for Player {
    fn default() -> Self {
        Player {
            name: [0u8; NAME_LENGTH],
            wallet_address: Pubkey::default(),
            nb_games: 0,
        }
    }
}
