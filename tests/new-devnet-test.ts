import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { BN } from "bn.js";

// Define a type for our portfolio account
type PortfolioAccount = {
  name: Uint8Array;
  walletAddress: anchor.web3.PublicKey;
  nbTokens: number;
  nbTransactions: number;
  amountTotalTokens: number;
  amountTotalValueStablecoin: number;
  datePortfolio: number;
};

// Custom provider that implements sendAndConfirm
class CustomAnchorProvider extends anchor.AnchorProvider {
  async sendAndConfirm(tx: anchor.web3.Transaction, signers?: anchor.web3.Signer[], opts?: anchor.web3.ConfirmOptions): Promise<string> {
    // Add signers to the transaction
    if (signers) {
      tx.feePayer = this.wallet.publicKey;
      tx.partialSign(...signers);
    }

    // Sign with the wallet
    const signedTx = await this.wallet.signTransaction(tx);
    
    // Send the transaction
    const signature = await this.connection.sendRawTransaction(signedTx.serialize());
    
    // Confirm the transaction
    await this.connection.confirmTransaction(signature, opts?.commitment || this.opts.commitment);
    
    return signature;
  }
}

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
  const wallet = new anchor.Wallet(walletKeypair);
  
  // Create a custom provider with the wallet that implements sendAndConfirm
  const provider = new CustomAnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed", skipPreflight: true }
  );
  anchor.setProvider(provider);
  
  try {
    // Load the IDL directly from the file system instead of fetching it
    let idl;
    try {
      // Try to load from the target/idl directory first
      const idlPath = path.join(process.cwd(), "target", "idl", "portfolio_program.json");
      idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    } catch (e) {
      // If that fails, try to load from the target/types directory
      try {
        const typesPath = path.join(process.cwd(), "target", "types", "portfolio_program.ts");
        // This is a fallback and might not work if the file is in .gitignore
        console.log("Could not load IDL from target/idl, trying to load from types...");
        // Since we can't directly import from a .ts file, we'll use Program.fetchIdl as a last resort
        idl = await Program.fetchIdl(programId, provider);
        if (!idl) throw new Error("IDL not found");
      } catch (e2) {
        console.error("Failed to load IDL from types:", e2);
        throw new Error("Could not load IDL from any location");
      }
    }
    
    const program = new Program(idl, programId, provider);
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
          user: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([portfolioKeypair])
        .rpc();
      
      console.log("Transaction signature:", tx);
      await connection.confirmTransaction(tx);
      console.log("Transaction confirmed!");
      
      // Fetch the created account
      const portfolioAccount = await program.account.portfolio.fetch(portfolioKeypair.publicKey) as PortfolioAccount;
      
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
      
      // Default values for other parameters
      const nbTokens = 5;
      const nbTransactions = 10;
      const amountTotalTokens = 100;
      const amountTotalValueStablecoin = 1000;
      const datePortfolio = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      
      const updateTx = await program.methods
        .updatePortfolio(
          newName,
          nbTokens,
          nbTransactions,
          amountTotalTokens,
          amountTotalValueStablecoin,
          datePortfolio
        )
        .accounts({
          portfolio: portfolioKeypair.publicKey,
          user: wallet.publicKey,
        })
        .rpc();
      
      console.log("Update transaction signature:", updateTx);
      await connection.confirmTransaction(updateTx);
      console.log("Update transaction confirmed!");
      
      // Fetch the updated account
      const updatedPortfolioAccount = await program.account.portfolio.fetch(portfolioKeypair.publicKey) as PortfolioAccount;
      
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
      console.error("Error during portfolio operations:", error);
    }
  } catch (error) {
    console.error("Error setting up program:", error);
  }
}

// Run the main function
main().catch(error => console.error("Top-level error:", error));
