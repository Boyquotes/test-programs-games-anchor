import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PortfolioProgram } from "../target/types/portfolio_program";

describe("portfolio_program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PortfolioProgram as Program<PortfolioProgram>;

  it("Creates and updates a portfolio", async () => {
    // Generate a new keypair for the portfolio account
    const portfolioKeypair = anchor.web3.Keypair.generate();
    const testName = "TestPortfolio";
    
    // Initialize a portfolio
    console.log("Creating portfolio with address:", portfolioKeypair.publicKey.toString());
    console.log("Initializing portfolio with name:", testName);
    
    const tx = await program.methods
      .initializePortfolio(testName)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: anchor.getProvider().publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([portfolioKeypair])
      .rpc();
    
    console.log("Your transaction signature", tx);
    
    // Verify the portfolio was created correctly
    let portfolioAccount = await program.account.portfolio.fetch(portfolioKeypair.publicKey);
    
    // Verify name field
    let nameFromAccount = Buffer.from(portfolioAccount.name)
      .toString("utf-8")
      .replace(/\0/g, "");
    console.log("Portfolio name:", nameFromAccount);
    console.assert(nameFromAccount === testName, "Portfolio name should match");
    
    // Verify wallet address
    console.log("Wallet address:", portfolioAccount.walletAddress.toString());
    console.assert(
      portfolioAccount.walletAddress.equals(anchor.getProvider().publicKey),
      "Wallet address should match the signer's public key"
    );
    
    // Now update the portfolio with new values
    console.log("\nUpdating portfolio with new values...");
    const newName = "UpdatedPortfolio";
    const nbTokens = 10;
    const nbTransactions = 20;
    const amountTotalTokens = 30;
    const amountTotalValueStablecoin = 40;
    const datePortfolio = 1789876754;
    
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
        user: anchor.getProvider().publicKey,
      })
      .rpc();
    
    console.log("Update transaction signature:", updateTx);
    
    // Fetch the updated portfolio
    const updatedPortfolioAccount = await program.account.portfolio.fetch(portfolioKeypair.publicKey);
    
    // Verify updated name
    const updatedNameFromAccount = Buffer.from(updatedPortfolioAccount.name)
      .toString("utf-8")
      .replace(/\0/g, "");
    console.log("Updated portfolio name:", updatedNameFromAccount);
    console.assert(updatedNameFromAccount === newName, "Updated portfolio name should match");
    
    // Verify updated values
    console.log("Updated number of tokens:", updatedPortfolioAccount.nbTokens);
    console.assert(updatedPortfolioAccount.nbTokens === nbTokens, `nbTokens should be updated to ${nbTokens}`);
    
    console.log("Updated number of transactions:", updatedPortfolioAccount.nbTransactions);
    console.assert(updatedPortfolioAccount.nbTransactions === nbTransactions, `nbTransactions should be updated to ${nbTransactions}`);
    
    console.log("Updated total amount of tokens:", updatedPortfolioAccount.amountTotalTokens);
    console.assert(updatedPortfolioAccount.amountTotalTokens === amountTotalTokens, `amountTotalTokens should be updated to ${amountTotalTokens}`);
    
    console.log("Updated total value in stablecoin:", updatedPortfolioAccount.amountTotalValueStablecoin);
    console.assert(updatedPortfolioAccount.amountTotalValueStablecoin === amountTotalValueStablecoin, `amountTotalValueStablecoin should be updated to ${amountTotalValueStablecoin}`);
    
    // Verify date_portfolio is set to the specific timestamp
    console.log("Updated portfolio creation date:", updatedPortfolioAccount.datePortfolio);
    console.assert(updatedPortfolioAccount.datePortfolio === datePortfolio, `datePortfolio should be set to ${datePortfolio}`);
  });
});