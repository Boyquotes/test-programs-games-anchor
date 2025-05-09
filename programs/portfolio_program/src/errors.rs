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
