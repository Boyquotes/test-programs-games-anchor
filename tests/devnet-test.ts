import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PortfolioProgram } from "../target/types/portfolio_program";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

// This script tests the Portfolio program on devnet
async function main() {
  // Configure the client to use the devnet cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.PortfolioProgram as Program<PortfolioProgram>;
  console.log("Program ID:", program.programId.toString());
  
  // Generate a new keypair for the portfolio account
  const portfolioKeypair = anchor.web3.Keypair.generate();
  console.log("Portfolio Account:", portfolioKeypair.publicKey.toString());
  
  const name = "MyDevnetPortfolio";
  
  try {
    // Initialize a portfolio
    console.log("Initializing portfolio with name:", name);
    const tx = await program.methods
      .initializePortfolio(name)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([portfolioKeypair])
      .rpc();
    
    console.log("Transaction signature:", tx);
    
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
    
    // Update the portfolio with a new name
    const newName = "UpdatedDevnetPortfolio";
    console.log("Updating portfolio with new name:", newName);
    
    const updateTx = await program.methods
      .updatePortfolio(newName)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("Update transaction signature:", updateTx);
    
    // Fetch the updated account
    const updatedPortfolioAccount = await program.account.portfolio.fetch(
      portfolioKeypair.publicKey
    );
    
    // Convert the byte array to a string and trim null bytes
    const newNameFromAccount = Buffer.from(updatedPortfolioAccount.name)
      .toString("utf-8")
      .replace(/\0/g, "");
    
    console.log("Updated portfolio name from account:", newNameFromAccount);
    
    // Verify that the name was updated
    if (newNameFromAccount === newName) {
      console.log("✅ Portfolio successfully updated!");
    } else {
      console.log("❌ Portfolio update failed!");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main().catch(console.error);
