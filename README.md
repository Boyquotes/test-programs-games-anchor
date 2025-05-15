# Portfolio Program - Solana Anchor

A Solana blockchain program built with Anchor framework for managing portfolios, games, and players. This program demonstrates the implementation of account management on Solana's devnet.

## Project Structure

The project consists of three main modules:

1. **Portfolio Module** - Manage user portfolios
2. **Game Module** - Create and update games
3. **Player Module** - Register and manage players

## Instructions

### Portfolio Instructions

#### `initialize_portfolio`
Creates a new portfolio account with the following properties:
- `name`: Name of the portfolio (alphanumeric only)
- `wallet_address`: Owner's wallet address
- `nb_tokens`: Number of tokens (initialized to 0)
- `nb_transactions`: Number of transactions (initialized to 0)
- `amount_total_tokens`: Total amount of tokens (initialized to 0)
- `amount_total_value_stablecoin`: Total value in stablecoin (initialized to 0)
- `date_portfolio`: Portfolio creation timestamp

#### `update_portfolio`
Updates an existing portfolio with new values:
- Updates the portfolio name
- Updates token count, transaction count, total tokens, and total value
- Updates the portfolio timestamp
- Only the portfolio owner can update their portfolio

### Game Instructions

#### `initialize_game`
Creates a new game account with the following properties:
- `name`: Name of the game (alphanumeric only)
- `wallet_address`: Creator's wallet address
- `total_max_players`: Maximum number of players (initialized to 0)
- `date_game`: Game creation timestamp

#### `update_game`
Updates an existing game with new values:
- Updates the game name
- Updates the maximum number of players
- Updates the game timestamp
- Only the game creator can update their game

### Player Instructions

#### `initialize_player`
Creates a new player account with the following properties:
- `name`: Player name (alphanumeric only)
- `wallet_address`: Player's wallet address
- `nb_games`: Number of games played (initialized to 0)

#### `update_player`
Updates an existing player with new values:
- Updates the player name
- Updates the number of games played
- Only the player can update their own account

#### `register_player`
Registers a player to a specific game:
- Links a player to a game
- Updates relevant counters

## Testing Commands

### Running Tests on Devnet

```bash
# Run the TypeScript tests on Solana devnet
yarn ts-node tests/devnet-test.ts

# Run the shell script tests on Solana devnet
bash tests/devnet-test.sh
```

### Test Script Details

The `devnet-test.ts` file contains comprehensive tests for the program, including:

1. **Portfolio Tests**:
   - Initialize a portfolio with a name
   - Update the portfolio with new values
   - Verify all fields are correctly updated

2. **Game Tests**:
   - Initialize a game with a name
   - Update the game with new values
   - Verify all fields are correctly updated

3. **Player Tests**:
   - Initialize a player with a name
   - Update the player with new values
   - Register a player to a game
   - Verify all fields are correctly updated

## Important Notes

When testing on Solana devnet, be aware that account updates may not be reflected immediately after transaction confirmation. The test scripts implement retry logic with longer delays between transaction submission and account fetching to handle this issue. This is due to devnet latency or caching issues.

## Development Setup

1. Install dependencies:
```bash
yarn install
```

2. Build the program:
```bash
anchor build
```

3. Deploy to devnet:
```bash
anchor deploy --provider.cluster devnet
```

4. Run tests:
```bash
yarn ts-node tests/devnet-test.ts
```
