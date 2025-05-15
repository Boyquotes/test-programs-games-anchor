pub const NAME_LENGTH: usize = 50;
pub const DISCRIMINATOR_LENGTH: usize = 8;
pub const PUBLIC_KEY_LENGTH: usize = 32;
pub const U32_LENGTH: usize = 4;
pub const INT_LENGTH: usize = 4;

// Calculate the size of the Portfolio account
// Discriminator (8) + name (50) + wallet_address (32) + nb_tokens (4) + nb_transactions (4) 
// + amount_total_tokens (4) + amount_total_value_stablecoin (4) + date_portfolio (4) = 110 bytes
pub const PORTFOLIO_SIZE: usize = DISCRIMINATOR_LENGTH + NAME_LENGTH + PUBLIC_KEY_LENGTH + 
                                 U32_LENGTH + U32_LENGTH + U32_LENGTH + U32_LENGTH + INT_LENGTH;

// Calculate the size of the Game account
// Discriminator (8) + name (50) + total_max_players (4) + date_game (4) = 66 bytes 
pub const GAME_SIZE: usize = DISCRIMINATOR_LENGTH + NAME_LENGTH + U32_LENGTH + INT_LENGTH;

// Calculate the size of the Player account
// Discriminator (8) + name (50) + wallet_address (32) + nb_games (4) = 90 bytes
pub const PLAYER_SIZE: usize = DISCRIMINATOR_LENGTH + NAME_LENGTH + PUBLIC_KEY_LENGTH + U32_LENGTH;
