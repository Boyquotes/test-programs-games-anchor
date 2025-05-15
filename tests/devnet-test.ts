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
    // Get a recent blockhash
    const latestBlockhash = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    
    // Set fee payer
    tx.feePayer = this.wallet.publicKey;
    
    // Add signers to the transaction
    if (signers && signers.length > 0) {
      tx.partialSign(...signers);
    }

    // Sign with the wallet
    const signedTx = await this.wallet.signTransaction(tx);
    
    // Send the transaction
    const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: this.opts.skipPreflight,
      preflightCommitment: this.opts.preflightCommitment || this.opts.commitment,
    });
    
    // Confirm the transaction
    const confirmation = await this.connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: signature
    }, opts?.commitment || this.opts.commitment);
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }
    
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
  // Use 'finalized' commitment level for more reliable testing on devnet
  const provider = new CustomAnchorProvider(
    connection,
    wallet,
    { commitment: "finalized", skipPreflight: true }
  );
  anchor.setProvider(provider);
  
  try {
    // First try to use the workspace approach which is most reliable
    console.log("Attempting to use Anchor workspace...");
    let program = anchor.workspace.PortfolioProgram;
    
    if (program) {
      console.log("Successfully loaded program from Anchor workspace");
    } else {
      console.log("Workspace approach failed, trying direct IDL loading...");
      
      // Try to fetch the IDL from the chain
      try {
        console.log("Attempting to fetch IDL from the chain...");
        const idl = await Program.fetchIdl(programId, provider);
        
        if (!idl) {
          throw new Error("IDL not found on chain");
        }
        
        console.log("Successfully fetched IDL from the chain");
        program = new anchor.Program(idl, programId, provider);
      } catch (e) {
        console.error("Failed to fetch IDL from chain:", e.message);
        throw new Error("Could not load program using any method. Make sure the program is deployed and the IDL is available.");
      }
    }
    
    console.log("Program ID:", program.programId.toString());
    
    // Generate a new keypair for the portfolio account
    const portfolioKeypair = anchor.web3.Keypair.generate();
    console.log("Portfolio Account:", portfolioKeypair.publicKey.toString());
    
    const portfolioName = "MyDevnetPortfolio";
    
    // ==================== PORTFOLIO TESTS ====================
    console.log("\n========== PORTFOLIO TESTS ==========\n");
    
    try {
      // Initialize a portfolio
      console.log("Initializing portfolio with name:", portfolioName);
      const portfolioTx = await program.methods
        .initializePortfolio(portfolioName)
        .accounts({
          portfolio: portfolioKeypair.publicKey,
          user: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([portfolioKeypair])
        .rpc();
      
      console.log("Transaction signature:", portfolioTx);
      
      // Confirm transaction with more detailed status checking
      try {
        const latestBlockhash = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
          signature: portfolioTx,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log("Transaction confirmed successfully");
        
        // Get transaction details to verify it was processed correctly
        const txDetails = await connection.getTransaction(portfolioTx, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        console.log("Transaction details:", {
          slot: txDetails?.slot,
          blockTime: txDetails?.blockTime,
        });
      } catch (e) {
        console.error("Error confirming transaction:", e);
        throw e;
      }
      
      // Add a longer delay to ensure the account is available (devnet can be slow)
      console.log("Waiting for account to be available (30 seconds)...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Fetch the created account with retry logic using 'finalized' commitment
      let portfolioAccount: PortfolioAccount | null = null;
      let retries = 5; // Increase number of retries
      
      while (retries > 0 && !portfolioAccount) {
        try {
          // Use 'finalized' commitment level for more reliable account fetching
          portfolioAccount = await program.account.portfolio.fetch(
            portfolioKeypair.publicKey,
            'finalized'
          ) as PortfolioAccount;
          console.log("Successfully fetched portfolio account");
        } catch (e) {
          console.log(`Retry attempt ${6 - retries}/5: Failed to fetch portfolio account: ${e.message}`);
          retries--;
          if (retries > 0) {
            console.log("Waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Longer wait between retries
          } else {
            throw new Error(`Failed to fetch portfolio account after multiple attempts: ${e.message}`);
          }
        }
      }
      
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
      const newPortfolioName = "UpdatedDevnetPortfolio";
      console.log("\nUpdating portfolio with new name:", newPortfolioName);
      
      // Use distinct values for parameters to easily verify updates
      const nbTokens = 5;
      const nbTransactions = 10;
      const amountTotalTokens = 100;
      const amountTotalValueStablecoin = 1000;
      const datePortfolio = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      
      console.log("Update parameters:");
      console.log("- New name:", newPortfolioName);
      console.log("- Token count:", nbTokens);
      console.log("- Transaction count:", nbTransactions);
      console.log("- Total tokens:", amountTotalTokens);
      console.log("- Total value:", amountTotalValueStablecoin);
      console.log("- Date:", new Date(datePortfolio * 1000).toISOString());
      
      const updatePortfolioTx = await program.methods
        .updatePortfolio(
          newPortfolioName,
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
      
      console.log("Update transaction signature:", updatePortfolioTx);
      
      // Confirm transaction with more detailed status checking using 'finalized' commitment
      try {
        const latestBlockhash = await connection.getLatestBlockhash('finalized');
        const confirmation = await connection.confirmTransaction({
          signature: updatePortfolioTx,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'finalized');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log("Update transaction confirmed with finalized commitment!");
        
        // Get transaction details to verify it was processed correctly
        const txDetails = await connection.getTransaction(updatePortfolioTx, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0
        });
        
        console.log("Update transaction details:", {
          slot: txDetails?.slot,
          blockTime: txDetails?.blockTime,
        });
      } catch (e) {
        console.error("Error confirming update transaction:", e);
        throw e;
      }
      
      // Add a much longer delay to ensure the updated account is available
      console.log("Waiting for updated portfolio account to be available (45 seconds)...");
      await new Promise(resolve => setTimeout(resolve, 45000));
      
      // Fetch the updated account with retry logic using 'finalized' commitment
      let updatedPortfolioAccount: PortfolioAccount | null = null;
      let updateRetries = 5;
      
      while (updateRetries > 0 && !updatedPortfolioAccount) {
        try {
          updatedPortfolioAccount = await program.account.portfolio.fetch(
            portfolioKeypair.publicKey,
            'finalized'
          ) as PortfolioAccount;
          console.log("Successfully fetched updated portfolio account");
        } catch (e) {
          console.log(`Retry attempt ${6 - updateRetries}/5: Failed to fetch updated portfolio account: ${e.message}`);
          updateRetries--;
          if (updateRetries > 0) {
            console.log("Waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            throw new Error(`Failed to fetch updated portfolio account after multiple attempts: ${e.message}`);
          }
        }
      }
      
      // Convert the byte array to a string and trim null bytes
      const newNameFromAccount = Buffer.from(updatedPortfolioAccount.name)
        .toString("utf-8")
        .replace(/\0/g, "");
      
      console.log("Updated portfolio name from account:", newNameFromAccount);
      
      // Display all other portfolio fields again to verify they were updated
      console.log("Number of tokens:", updatedPortfolioAccount.nbTokens);
      console.log("Number of transactions:", updatedPortfolioAccount.nbTransactions);
      console.log("Total amount of tokens:", updatedPortfolioAccount.amountTotalTokens);
      console.log("Total value in stablecoin:", updatedPortfolioAccount.amountTotalValueStablecoin);
      console.log("Portfolio creation date:", new Date(updatedPortfolioAccount.datePortfolio * 1000).toISOString());
      
      // Verify that the fields were updated
      let updateSuccessful = true;
      
      if (newNameFromAccount !== newPortfolioName) {
        console.log(`❌ Portfolio name update failed! Expected: ${newPortfolioName}, Got: ${newNameFromAccount}`);
        updateSuccessful = false;
      }
      
      if (updatedPortfolioAccount.nbTokens !== nbTokens) {
        console.log(`❌ Portfolio token count update failed! Expected: ${nbTokens}, Got: ${updatedPortfolioAccount.nbTokens}`);
        updateSuccessful = false;
      }
      
      if (updatedPortfolioAccount.nbTransactions !== nbTransactions) {
        console.log(`❌ Portfolio transaction count update failed! Expected: ${nbTransactions}, Got: ${updatedPortfolioAccount.nbTransactions}`);
        updateSuccessful = false;
      }
      
      if (updatedPortfolioAccount.amountTotalTokens !== amountTotalTokens) {
        console.log(`❌ Portfolio total tokens update failed! Expected: ${amountTotalTokens}, Got: ${updatedPortfolioAccount.amountTotalTokens}`);
        updateSuccessful = false;
      }
      
      if (updatedPortfolioAccount.amountTotalValueStablecoin !== amountTotalValueStablecoin) {
        console.log(`❌ Portfolio total value update failed! Expected: ${amountTotalValueStablecoin}, Got: ${updatedPortfolioAccount.amountTotalValueStablecoin}`);
        updateSuccessful = false;
      }
      
      if (updateSuccessful) {
        console.log("✅ Portfolio successfully updated!");
      } else {
        console.log("❌ Some portfolio updates failed. See details above.");
      }
    } catch (error) {
      console.error("Error during portfolio operations:", error);
    }
    
    // ==================== GAME TESTS ====================
    console.log("\n========== GAME TESTS ==========\n");
    
    try {
      // Define a type for our game account
      type GameAccount = {
        name: Uint8Array;
        walletAddress: anchor.web3.PublicKey;
        totalMaxPlayers: number;
        dateGame: number;
      };
      
      // Generate a new keypair for the game account
      const gameKeypair = anchor.web3.Keypair.generate();
      console.log("Game Account:", gameKeypair.publicKey.toString());
      
      const gameName = "DevnetTestGame";
      
      // Initialize a game
      console.log("Initializing game with name:", gameName);
      const gameTx = await program.methods
        .initializeGame(gameName)
        .accounts({
          game: gameKeypair.publicKey,
          user: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([gameKeypair])
        .rpc();
      
      console.log("Game transaction signature:", gameTx);
      
      // Confirm transaction with more detailed status checking using 'finalized' commitment
      try {
        const latestBlockhash = await connection.getLatestBlockhash('finalized');
        const confirmation = await connection.confirmTransaction({
          signature: gameTx,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'finalized');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log("Game transaction confirmed with finalized commitment!");
        
        // Get transaction details to verify it was processed correctly
        const txDetails = await connection.getTransaction(gameTx, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0
        });
        
        console.log("Game transaction details:", {
          slot: txDetails?.slot,
          blockTime: txDetails?.blockTime,
        });
      } catch (e) {
        console.error("Error confirming game transaction:", e);
        throw e;
      }
      
      // Add a much longer delay to ensure the account is available (devnet can be very slow)
      console.log("Waiting for game account to be available (30 seconds)...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Fetch the created game account with retry logic using 'finalized' commitment
      let gameAccount: GameAccount | null = null;
      let retries = 5; // Increase number of retries
      
      while (retries > 0 && !gameAccount) {
        try {
          // Use 'finalized' commitment level for more reliable account fetching
          gameAccount = await program.account.game.fetch(
            gameKeypair.publicKey,
            'finalized'
          ) as GameAccount;
          console.log("Successfully fetched game account");
        } catch (e) {
          console.log(`Retry attempt ${6 - retries}/5: Failed to fetch game account: ${e.message}`);
          retries--;
          if (retries > 0) {
            console.log("Waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Longer wait between retries
          } else {
            throw new Error(`Failed to fetch game account after multiple attempts: ${e.message}`);
          }
        }
      }
      
      // Convert the byte array to a string and trim null bytes
      const gameNameFromAccount = Buffer.from(gameAccount.name)
        .toString("utf-8")
        .replace(/\0/g, "");
      
      console.log("Game name from account:", gameNameFromAccount);
      console.log("Game wallet address:", gameAccount.walletAddress.toString());
      console.log("Game total max players:", gameAccount.totalMaxPlayers);
      console.log("Game creation date:", new Date(gameAccount.dateGame * 1000).toISOString());
      
      // Update the game with a new name
      const newGameName = "UpdatedDevnetGame";
      const newTotalMaxPlayers = 200;
      const newDateGame = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      
      console.log("\nUpdating game with new parameters:");
      console.log("- New name:", newGameName);
      console.log("- Wallet address:", wallet.publicKey.toString());
      console.log("- Total max players:", newTotalMaxPlayers);
      console.log("- Date:", new Date(newDateGame * 1000).toISOString());
      const updateGameTx = await program.methods
        .updateGame(
          newGameName,
          wallet.publicKey, // Keep the same wallet address
          newTotalMaxPlayers,
          newDateGame
        )
        .accounts({
          game: gameKeypair.publicKey,
          user: wallet.publicKey,
        })
        .rpc();
      
      console.log("Game update transaction signature:", updateGameTx);
      
      // Confirm transaction with more detailed status checking using 'finalized' commitment
      try {
        const latestBlockhash = await connection.getLatestBlockhash('finalized');
        const confirmation = await connection.confirmTransaction({
          signature: updateGameTx,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'finalized');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log("Game update transaction confirmed with finalized commitment!");
        
        // Get transaction details to verify it was processed correctly
        const txDetails = await connection.getTransaction(updateGameTx, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0
        });
        
        console.log("Game update transaction details:", {
          slot: txDetails?.slot,
          blockTime: txDetails?.blockTime,
        });
      } catch (e) {
        console.error("Error confirming game update transaction:", e);
        throw e;
      }
      
      // Add a much longer delay to ensure the updated game account is available
      console.log("Waiting for updated game account to be available (45 seconds)...");
      await new Promise(resolve => setTimeout(resolve, 45000));
      
      // Fetch the updated game account with retry logic using 'finalized' commitment
      let updatedGameAccount: GameAccount | null = null;
      let updateRetries = 5;
      
      while (updateRetries > 0 && !updatedGameAccount) {
        try {
          updatedGameAccount = await program.account.game.fetch(
            gameKeypair.publicKey,
            'finalized'
          ) as GameAccount;
          console.log("Successfully fetched updated game account");
        } catch (e) {
          console.log(`Retry attempt ${6 - updateRetries}/5: Failed to fetch updated game account: ${e.message}`);
          updateRetries--;
          if (updateRetries > 0) {
            console.log("Waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            throw new Error(`Failed to fetch updated game account after multiple attempts: ${e.message}`);
          }
        }
      }
      
      // Convert the byte array to a string and trim null bytes
      const newGameNameFromAccount = Buffer.from(updatedGameAccount.name)
        .toString("utf-8")
        .replace(/\0/g, "");
      
      console.log("Updated game name from account:", newGameNameFromAccount);
      console.log("Updated game wallet address:", updatedGameAccount.walletAddress.toString());
      console.log("Updated game total max players:", updatedGameAccount.totalMaxPlayers);
      console.log("Updated game creation date:", new Date(updatedGameAccount.dateGame * 1000).toISOString());
      
      // Verify that the game was updated correctly with more detailed error messages
      let gameUpdateSuccessful = true;
      
      if (newGameNameFromAccount !== newGameName) {
        console.log(`❌ Game name update failed! Expected: ${newGameName}, Got: ${newGameNameFromAccount}`);
        gameUpdateSuccessful = false;
      } else {
        console.log("✅ Game name successfully updated!");
      }
      
      // Check if wallet address was updated correctly
      const expectedWalletAddress = wallet.publicKey.toString();
      const actualWalletAddress = updatedGameAccount.walletAddress.toString();
      if (actualWalletAddress !== expectedWalletAddress) {
        console.log(`❌ Game wallet address update failed! Expected: ${expectedWalletAddress}, Got: ${actualWalletAddress}`);
        gameUpdateSuccessful = false;
      } else {
        console.log("✅ Game wallet address successfully updated!");
      }
      
      if (updatedGameAccount.totalMaxPlayers !== newTotalMaxPlayers) {
        console.log(`❌ Game total max players update failed! Expected: ${newTotalMaxPlayers}, Got: ${updatedGameAccount.totalMaxPlayers}`);
        gameUpdateSuccessful = false;
      } else {
        console.log("✅ Game total max players successfully updated!");
      }
      
      if (updatedGameAccount.dateGame !== newDateGame) {
        console.log(`❌ Game date update failed! Expected: ${newDateGame}, Got: ${updatedGameAccount.dateGame}`);
        gameUpdateSuccessful = false;
      } else {
        console.log("✅ Game date successfully updated!");
      }
      
      if (gameUpdateSuccessful) {
        console.log("✅ All game updates were successful!");
      } else {
        console.log("❌ Some game updates failed. See details above.");
      }
    } catch (error) {
      console.error("Error during game operations:", error);
    }
  } catch (error) {
    console.error("Error setting up program:", error);
  }
}

// Run the main function
main().catch(error => console.error("Top-level error:", error));
