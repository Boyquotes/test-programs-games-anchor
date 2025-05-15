use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct Game {
    // name: string max 50 characters with letters and numbers only
    pub name: [u8; NAME_LENGTH],
    
    // wallet_address: Wallet address of the game
    pub wallet_address: Pubkey,
    
    // total_max_players: Total number of players allowed in the game
    pub total_max_players: u32,
    
    // date_game: Creation date of the game
    pub date_game: i32,
}

impl Default for Game {
    fn default() -> Self {
        Game {
            name: [0u8; NAME_LENGTH],
            wallet_address: Pubkey::default(),
            total_max_players: 100,
            date_game: 0,
        }
    }
}
