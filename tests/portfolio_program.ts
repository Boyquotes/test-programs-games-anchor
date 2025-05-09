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
    const portfolioAccount = await program.account.portfolio.fetch(portfolioKeypair.publicKey);
    const nameFromAccount = Buffer.from(portfolioAccount.name)
      .toString("utf-8")
      .replace(/\0/g, "");
    
    console.log("Portfolio name:", nameFromAccount);
    console.assert(nameFromAccount === testName, "Portfolio name should match");
  });
});