const {
    Connection,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
  } = require('@solana/web3.js');
  const {
    createApproveInstruction,
    TOKEN_PROGRAM_ID,
  } = require('@solana/spl-token');

  const bs58 = require('bs58');

  const contractAddress = process.env.TOKEN_ADDRESS
  const programId = process.env.PROGRAM_ID
  const solanaServer = process.env.SOLANA_RPC_SERVER
  
  // Your custom token mint address and liquidity pool program ID
  const tokenMint = new PublicKey(contractAddress); // Replace with your token mint address
  const liquidityPoolProgramId = new PublicKey(programId); // Replace with your pool's program ID
  const privateKeyBase58 = process.env.PRIVATE_KEY;
  
  // Decode the provided keypair
  const privateKey = bs58.decode(privateKeyBase58);
  const keypair = Keypair.fromSecretKey(privateKey);
  
  console.log("Private key loaded successfully");
  
  const connection = new Connection(solanaServer);
  
  async function addLiquidity() {
    try {
      console.log(`Fetching token accounts for mint: ${tokenMint.toBase58()}`);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        keypair.publicKey,
        { mint: tokenMint }
      );
  
      if (tokenAccounts.value.length === 0) {
        console.error('No token accounts found for the provided mint.');
        return;
      }
  
      // Check balances and ensure sufficient tokens
      const tokenAccount = tokenAccounts.value[0];
      const tokenBalance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
      const amountToDepositToken = 1; // Specify the amount of your token to deposit
  
      if (tokenBalance < amountToDepositToken) {
        console.error('Insufficient token balance.');
        return;
      }
  
      // Calculate the amount of SOL to add to the pool
      const amountToDepositSol = 1 * LAMPORTS_PER_SOL; // Specify the amount of SOL to deposit
  
      // Approve the token transfer
      const approveInstruction = createApproveInstruction(
        tokenAccount.pubkey,
        liquidityPoolProgramId,
        keypair.publicKey,
        amountToDepositToken * Math.pow(10, tokenAccount.account.data.parsed.info.tokenAmount.decimals),
        [],
        TOKEN_PROGRAM_ID
      );
  
      // Create a transaction to transfer SOL to the pool
      const solTransferInstruction = SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: liquidityPoolProgramId,
        lamports: amountToDepositSol,
      });
  
      // Create and send the transaction
      const transaction = new Transaction().add(approveInstruction, solTransferInstruction);
      const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
  
      console.log('Liquidity added successfully. Signature:', signature);
    } catch (error) {
      console.error('Error adding liquidity:', error);
    }
  }
  
  addLiquidity().catch(err => {
    console.error('Error adding liquidity:', err);
  });
  