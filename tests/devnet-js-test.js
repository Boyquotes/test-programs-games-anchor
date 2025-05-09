const anchor = require('@coral-xyz/anchor');
const { web3 } = anchor;

// Execute this script to test the portfolio program on devnet
async function main() {
  console.log('Starting devnet test...');
  
  // Get program ID from Anchor.toml
  const programId = new web3.PublicKey('GMjxqNihJ5HrjDPDufCc7f7bmTxuMyP4G7xmC1H3XvnV');
  console.log('Program ID:', programId.toString());
  
  // Connect to devnet
  const connection = new web3.Connection('https://api.devnet.solana.com');
  
  // Load the user's wallet keypair from file
  const keypairFile = require('os').homedir() + '/.config/solana/id.json';
  const keypairData = require('fs').readFileSync(keypairFile);
  const walletKeypair = web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(keypairData.toString()))
  );
  const userWallet = new anchor.Wallet(walletKeypair);
  const walletPublicKey = userWallet.publicKey;
  console.log('Using wallet public key:', walletPublicKey.toString());
  
  // Initialize provider with connection and wallet
  const provider = new anchor.AnchorProvider(
    connection, 
    userWallet, 
    { commitment: 'confirmed' }
  );
  
  // Load the IDL
  const idl = require('../target/idl/portfolio_program.json');
  
  // Initialize program instance
  const program = new anchor.Program(idl, programId, provider);
  
  // Generate a new keypair for the portfolio account
  const portfolioKeypair = web3.Keypair.generate();
  console.log('Creating portfolio with address:', portfolioKeypair.publicKey.toString());
  
  const name = "DevnetPortfolio";
  
  try {
    console.log('Initializing portfolio...');
    const tx = await program.methods
      .initialize_portfolio(name)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: walletPublicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([portfolioKeypair])
      .rpc();
      
    console.log('Transaction signature:', tx);
    await connection.confirmTransaction(tx);
    console.log('Transaction confirmed!');
    
    // Fetch the created account
    console.log('Fetching portfolio data...');
    const portfolioData = await program.account.portfolio.fetch(portfolioKeypair.publicKey);
    
    // Convert name bytes to string
    const nameBytes = portfolioData.name;
    const nameString = Buffer.from(nameBytes)
      .toString('utf-8')
      .replace(/\0/g, ''); // Remove null bytes
      
    console.log('Portfolio name:', nameString);
    console.log('Wallet address:', portfolioData.wallet_address.toString());
    
    // Update portfolio
    const newName = "UpdatedDevnetPortfolio";
    console.log('\nUpdating portfolio name to:', newName);
    
    const updateTx = await program.methods
      .update_portfolio(newName)
      .accounts({
        portfolio: portfolioKeypair.publicKey,
        user: walletPublicKey,
      })
      .rpc();
    
    console.log('Update transaction signature:', updateTx);
    await connection.confirmTransaction(updateTx);
    console.log('Update transaction confirmed!');
    
    // Verify update
    console.log('Verifying update...');
    const updatedPortfolioData = await program.account.portfolio.fetch(portfolioKeypair.publicKey);
    
    // Convert updated name bytes to string
    const updatedNameBytes = updatedPortfolioData.name;
    const updatedNameString = Buffer.from(updatedNameBytes)
      .toString('utf-8')
      .replace(/\0/g, ''); // Remove null bytes
      
    console.log('Updated portfolio name:', updatedNameString);
    
    if (updatedNameString === newName) {
      console.log('✅ Portfolio successfully updated!');
    } else {
      console.log('❌ Portfolio update failed! Current name is:', updatedNameString);
    }
    
  } catch (err) {
    console.error('Error executing transaction:', err);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
});
