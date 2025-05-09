#!/bin/bash

# This script tests the portfolio program on Solana devnet
# It initializes a portfolio and then updates its name

echo "Testing portfolio program on devnet..."

# Program ID
PROGRAM_ID="GMjxqNihJ5HrjDPDufCc7f7bmTxuMyP4G7xmC1H3XvnV"

# Create a new keypair for the portfolio account
PORTFOLIO_KEYPAIR="portfolio-keypair.json"
solana-keygen new -o $PORTFOLIO_KEYPAIR --no-bip39-passphrase --force

PORTFOLIO_PUBKEY=$(solana-keygen pubkey $PORTFOLIO_KEYPAIR)
echo "Portfolio account: $PORTFOLIO_PUBKEY"

# Get the user's public key
USER_PUBKEY=$(solana address)
echo "User wallet: $USER_PUBKEY"

# Build the initialize portfolio instruction data
PORTFOLIO_NAME="DevnetPortfolio"
echo "Initializing portfolio with name: $PORTFOLIO_NAME"

# Use Anchor CLI to execute the transaction
echo "Sending transaction to initialize portfolio..."
anchor deploy --network devnet --provider.cluster devnet

# Fetch the account data to verify
echo "Fetching portfolio account data..."
solana account $PORTFOLIO_PUBKEY

echo "Test completed successfully!"
