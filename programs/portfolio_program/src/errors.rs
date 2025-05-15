use anchor_lang::prelude::*;

#[error_code]
pub enum PortfolioError {
    #[msg("Name can only contain letters and numbers")]
    InvalidNameFormat,
    
    #[msg("Name is too long, maximum length is 50 characters")]
    NameTooLong,
    
    #[msg("Only the portfolio owner can update this portfolio")]
    NotPortfolioOwner,
}

#[error_code]
pub enum GameError {
    #[msg("Name can only contain letters and numbers")]
    InvalidNameFormat,
    
    #[msg("Name is too long, maximum length is 50 characters")]
    NameTooLong,
    
    #[msg("Only the game owner can update this game")]
    NotGameOwner,
}

#[error_code]
pub enum PlayerError {
    #[msg("Name can only contain letters and numbers")]
    InvalidNameFormat,
    
    #[msg("Name is too long, maximum length is 50 characters")]
    NameTooLong,
    
    #[msg("Only the player owner can update this player")]
    NotPlayerOwner,
}

