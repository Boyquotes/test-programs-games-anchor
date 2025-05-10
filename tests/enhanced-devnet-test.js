const anchor = require('@coral-xyz/anchor');
const fs = require('fs');
const os = require('os');

// This script tests the Portfolio program on devnet
async function main() {
  console.log("Testing portfolio program on devnet...");

  // Program ID 
  const programId = new anchor.web3.PublicKey("GMjxqNihJ5HrjDPDufCc7f7bmTxuMyP4G7xmC1H3XvnV");
  
  // Load wallet from file
  const keypairFile = os.homedir() + "/.config/solana/id.json";
  const keypairData = fs.readFileSync(keypairFile);
  const walletKeypair = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(keypairData.toString()))
  );
  
  // Configure connection to devnet
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
  const walletWrapper = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(
    connection, 
    walletWrapper,
    { commitment: "confirmed" }
  );
  
  // Load the IDL
  const idl = JSON.parse(fs.readFileSync('./target/idl/portfolio_program.json', 'utf8'));
  
  // Create program instance
  const program = new anchor.Program(idl, programId, provider);
  console.log("Program ID:", program.programId.toString());
  
  // Generate a new keypair for the portfolio account
  const portfolioKeypair = anchor.web3.Keypair.generate();
  console.log("Portfolio Account:", portfolioKeypair.publicKey.toString());
  
  const portfolioName = "MyDevnetPortfolio";
  
  try {
    // Initialize a portfolio
    console.log("Initializing portfolio with name:", portfolioName);
    const tx = await program.methods
      .initialize_portfolio(portfolioName)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: walletKeypair.publicKey,
        system_program: anchor.web3.SystemProgram.programId,
      })
      .signers([portfolioKeypair])
      .rpc();
    
    console.log("Transaction signature:", tx);
    await provider.connection.confirmTransaction(tx);
    console.log("Transaction confirmed!");
    
    // Fetch the created account
    const portfolioAccount = await program.account.portfolio.fetch(
      portfolioKeypair.publicKey
    );
    
    // Convert the byte array to a string and trim null bytes
    const nameFromAccount = Buffer.from(portfolioAccount.name)
      .toString("utf-8")
      .replace(/\0/g, "");
    
    console.log("Portfolio name from account:", nameFromAccount);
    console.log("Wallet address:", portfolioAccount.wallet_address.toString());
    
    // Display all other portfolio fields
    console.log("Number of tokens:", portfolioAccount.nb_tokens);
    console.log("Number of transactions:", portfolioAccount.nb_transactions);
    console.log("Total amount of tokens:", portfolioAccount.amount_total_tokens);
    console.log("Total value in stablecoin:", portfolioAccount.amount_total_value_stablecoin);
    console.log("Portfolio creation date:", new Date(portfolioAccount.date_portfolio * 1000).toISOString());
    
    // Update the portfolio with a new name
    const newName = "UpdatedDevnetPortfolio";
    console.log("\nUpdating portfolio with new name:", newName);
    
    const updateTx = await program.methods
      .update_portfolio(newName)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: walletKeypair.publicKey,
      })
      .rpc();
    
    console.log("Update transaction signature:", updateTx);
    await provider.connection.confirmTransaction(updateTx);
    console.log("Update transaction confirmed!");
    
    // Fetch the updated account
    const updatedPortfolioAccount = await program.account.portfolio.fetch(
      portfolioKeypair.publicKey
    );
    
    // Convert the byte array to a string and trim null bytes
    const newNameFromAccount = Buffer.from(updatedPortfolioAccount.name)
      .toString("utf-8")
      .replace(/\0/g, "");
    
    console.log("Updated portfolio name from account:", newNameFromAccount);
    
    // Display all other portfolio fields again to verify they weren't changed
    console.log("Number of tokens:", updatedPortfolioAccount.nb_tokens);
    console.log("Number of transactions:", updatedPortfolioAccount.nb_transactions);
    console.log("Total amount of tokens:", updatedPortfolioAccount.amount_total_tokens);
    console.log("Total value in stablecoin:", updatedPortfolioAccount.amount_total_value_stablecoin);
    console.log("Portfolio creation date:", new Date(updatedPortfolioAccount.date_portfolio * 1000).toISOString());
    
    // Verify that the name was updated
    if (newNameFromAccount === newName) {
      console.log("✅ Portfolio successfully updated!");
    } else {
      console.log("❌ Portfolio update failed!");
    }
    
    // Verify that other fields remained unchanged
    console.log("\nVerifying other fields weren't changed:");
    console.log("- Wallet address unchanged:", 
      updatedPortfolioAccount.wallet_address.equals(portfolioAccount.wallet_address));
    console.log("- nb_tokens unchanged:", 
      updatedPortfolioAccount.nb_tokens === portfolioAccount.nb_tokens);
    console.log("- nb_transactions unchanged:", 
      updatedPortfolioAccount.nb_transactions === portfolioAccount.nb_transactions);
    console.log("- amount_total_tokens unchanged:", 
      updatedPortfolioAccount.amount_total_tokens === portfolioAccount.amount_total_tokens);
    console.log("- amount_total_value_stablecoin unchanged:", 
      updatedPortfolioAccount.amount_total_value_stablecoin === portfolioAccount.amount_total_value_stablecoin);
    console.log("- date_portfolio unchanged:", 
      updatedPortfolioAccount.date_portfolio === portfolioAccount.date_portfolio);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main().catch(console.error);
