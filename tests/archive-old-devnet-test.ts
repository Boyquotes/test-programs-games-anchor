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
    
    // Display and validate all other portfolio fields
    console.log("Number of tokens:", portfolioAccount.nbTokens);
    console.assert(portfolioAccount.nbTokens === 8, "nbTokens should be set to 8");
    
    console.log("Number of transactions:", portfolioAccount.nbTransactions);
    console.assert(portfolioAccount.nbTransactions === 8, "nbTransactions should be set to 8");
    
    console.log("Total amount of tokens:", portfolioAccount.amountTotalTokens);
    console.assert(portfolioAccount.amountTotalTokens === 8, "amountTotalTokens should be set to 8");
    
    console.log("Total value in stablecoin:", portfolioAccount.amountTotalValueStablecoin);
    console.assert(portfolioAccount.amountTotalValueStablecoin === 8, "amountTotalValueStablecoin should be set to 8");
    
    console.log("Portfolio creation date:", portfolioAccount.datePortfolio);
    console.assert(portfolioAccount.datePortfolio === 1789876754, "datePortfolio should be set to 1789876754");
    
    // Update the portfolio with new values
    const newName = "UpdatedDevnetPortfolio";
    const newNbTokens = 15;
    const newNbTransactions = 25;
    const newAmountTotalTokens = 35;
    const newAmountTotalValueStablecoin = 45;
    const newDatePortfolio = 1789876754;
    
    console.log("Updating portfolio with new values:");
    console.log("- Name:", newName);
    console.log("- Number of tokens:", newNbTokens);
    console.log("- Number of transactions:", newNbTransactions);
    console.log("- Amount total tokens:", newAmountTotalTokens);
    console.log("- Amount total value in stablecoin:", newAmountTotalValueStablecoin);
    console.log("- Date portfolio:", newDatePortfolio);
    
    const updateTx = await program.methods
      .updatePortfolio(
        newName,
        newNbTokens,
        newNbTransactions,
        newAmountTotalTokens,
        newAmountTotalValueStablecoin,
        newDatePortfolio
      )
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
    
    console.log("\nUpdated portfolio values from account:");
    console.log("- Name:", newNameFromAccount);
    console.log("- Number of tokens:", updatedPortfolioAccount.nbTokens);
    console.log("- Number of transactions:", updatedPortfolioAccount.nbTransactions);
    console.log("- Amount total tokens:", updatedPortfolioAccount.amountTotalTokens);
    console.log("- Amount total value in stablecoin:", updatedPortfolioAccount.amountTotalValueStablecoin);
    console.log("- Date portfolio:", updatedPortfolioAccount.datePortfolio);
    
    // Verify that all values were updated correctly
    console.log("Number of tokens:", updatedPortfolioAccount.nbTokens);
    console.log("Number of transactions:", updatedPortfolioAccount.nbTransactions);
    console.log("Total amount of tokens:", updatedPortfolioAccount.amountTotalTokens);
    console.log("Total value in stablecoin:", updatedPortfolioAccount.amountTotalValueStablecoin);
    console.log("Portfolio creation date:", new Date(updatedPortfolioAccount.datePortfolio * 1000).toISOString());
    
    // Verify that all values were updated correctly
    let allFieldsUpdated = true;
    
    if (newNameFromAccount !== newName) {
      console.log("❌ Name update failed!");
      allFieldsUpdated = false;
    }
    
    if (updatedPortfolioAccount.nbTokens !== newNbTokens) {
      console.log("❌ nbTokens update failed!");
      allFieldsUpdated = false;
    }
    
    if (updatedPortfolioAccount.nbTransactions !== newNbTransactions) {
      console.log("❌ nbTransactions update failed!");
      allFieldsUpdated = false;
    }
    
    if (updatedPortfolioAccount.amountTotalTokens !== newAmountTotalTokens) {
      console.log("❌ amountTotalTokens update failed!");
      allFieldsUpdated = false;
    }
    
    if (updatedPortfolioAccount.amountTotalValueStablecoin !== newAmountTotalValueStablecoin) {
      console.log("❌ amountTotalValueStablecoin update failed!");
      allFieldsUpdated = false;
    }
    
    if (updatedPortfolioAccount.datePortfolio !== newDatePortfolio) {
      console.log("❌ datePortfolio update failed!");
      allFieldsUpdated = false;
    }
    
    if (allFieldsUpdated) {
      console.log("✅ Portfolio successfully updated with all new values!");
    } else {
      console.log("❌ Some portfolio fields failed to update correctly!");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main().catch(console.error);
