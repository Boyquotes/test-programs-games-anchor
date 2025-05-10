import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as os from "os";
import { IDL } from "../target/types/portfolio_program";

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
  
  // Create program instance
  const program = new anchor.Program(IDL, programId, provider);
  console.log("Program ID:", program.programId.toString());
  
  // Generate a new keypair for the portfolio account
  const portfolioKeypair = anchor.web3.Keypair.generate();
  console.log("Portfolio Account:", portfolioKeypair.publicKey.toString());
  
  const portfolioName = "MyDevnetPortfolio";
  
  try {
    // Initialize a portfolio
    console.log("Initializing portfolio with name:", portfolioName);
    const tx = await program.methods
      .initializePortfolio(portfolioName)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: walletKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
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
    console.log("Wallet address:", portfolioAccount.walletAddress.toString());
    
    // Display all other portfolio fields
    console.log("Number of tokens:", portfolioAccount.nbTokens);
    console.log("Number of transactions:", portfolioAccount.nbTransactions);
    console.log("Total amount of tokens:", portfolioAccount.amountTotalTokens);
    console.log("Total value in stablecoin:", portfolioAccount.amountTotalValueStablecoin);
    console.log("Portfolio creation date:", new Date(portfolioAccount.datePortfolio * 1000).toISOString());
    
    // Update the portfolio with a new name
    const newName = "UpdatedDevnetPortfolio";
    console.log("\nUpdating portfolio with new name:", newName);
    
    const updateTx = await program.methods
      .updatePortfolio(newName)
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
    console.log("Number of tokens:", updatedPortfolioAccount.nbTokens);
    console.log("Number of transactions:", updatedPortfolioAccount.nbTransactions);
    console.log("Total amount of tokens:", updatedPortfolioAccount.amountTotalTokens);
    console.log("Total value in stablecoin:", updatedPortfolioAccount.amountTotalValueStablecoin);
    console.log("Portfolio creation date:", new Date(updatedPortfolioAccount.datePortfolio * 1000).toISOString());
    
    // Verify that the name was updated
    if (newNameFromAccount === newName) {
      console.log("✅ Portfolio successfully updated!");
    } else {
      console.log("❌ Portfolio update failed!");
    }
    
    // Verify that other fields remained unchanged
    console.log("\nVerifying other fields weren't changed:");
    console.log("- Wallet address unchanged:", 
      updatedPortfolioAccount.walletAddress.equals(portfolioAccount.walletAddress));
    console.log("- nbTokens unchanged:", 
      updatedPortfolioAccount.nbTokens === portfolioAccount.nbTokens);
    console.log("- nbTransactions unchanged:", 
      updatedPortfolioAccount.nbTransactions === portfolioAccount.nbTransactions);
    console.log("- amountTotalTokens unchanged:", 
      updatedPortfolioAccount.amountTotalTokens === portfolioAccount.amountTotalTokens);
    console.log("- amountTotalValueStablecoin unchanged:", 
      updatedPortfolioAccount.amountTotalValueStablecoin === portfolioAccount.amountTotalValueStablecoin);
    console.log("- datePortfolio unchanged:", 
      updatedPortfolioAccount.datePortfolio === portfolioAccount.datePortfolio);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main().catch(console.error);
