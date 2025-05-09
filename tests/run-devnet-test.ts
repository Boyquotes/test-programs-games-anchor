import { readFileSync } from 'fs';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PortfolioProgram } from '../target/types/portfolio_program';

// Read the IDL file
const idl = JSON.parse(
  readFileSync('./target/idl/portfolio_program.json', 'utf8')
);

// Set up the provider
const provider = AnchorProvider.env();
anchor.setProvider(provider);

// Create a program interface using the IDL, programID and provider
const programId = new web3.PublicKey('GMjxqNihJ5HrjDPDufCc7f7bmTxuMyP4G7xmC1H3XvnV');
const program = new Program(idl, programId) as Program<PortfolioProgram>;

async function main() {
  // Generate a new keypair for the portfolio account
  const portfolioKeypair = web3.Keypair.generate();
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
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([portfolioKeypair])
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Wait for confirmation
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
    
    // Update the portfolio with a new name
    const newName = "UpdatedDevnetPortfolio";
    console.log("\nUpdating portfolio with new name:", newName);
    
    const updateTx = await program.methods
      .updatePortfolio(newName)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("Update transaction signature:", updateTx);
    
    // Wait for confirmation
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
