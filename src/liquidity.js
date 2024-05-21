require('dotenv').config();
require('dotenv').config()
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
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');

const bs58 = require('bs58');

const contractAddress = process.env.TOKEN_ADDRESS;
const programId = process.env.PROGRAM_ID;
const solanaServer = process.env.SOLANA_RPC_SERVER;
const privateKeyBase58 = process.env.PRIVATE_KEY;

const tokenMint = new PublicKey(contractAddress);
const liquidityPoolProgramId = new PublicKey(programId);
const privateKey = bs58.decode(privateKeyBase58);
const keypair = Keypair.fromSecretKey(privateKey);

console.log('Private key loaded successfully');
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

    const tokenAccount = tokenAccounts.value[0];
    const tokenBalance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
    const amountToDepositToken = 1;

    if (tokenBalance < amountToDepositToken) {
      console.error('Insufficient token balance.');
      return;
    }

    const amountToDepositSol = 1 * LAMPORTS_PER_SOL;

    const approveInstruction = createApproveInstruction(
      tokenAccount.pubkey,
      liquidityPoolProgramId,
      keypair.publicKey,
      amountToDepositToken * Math.pow(10, tokenAccount.account.data.parsed.info.tokenAmount.decimals),
      [],
      TOKEN_PROGRAM_ID
    );

    const solTransferInstruction = SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: liquidityPoolProgramId,
      lamports: amountToDepositSol,
    });

    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      tokenMint,
      keypair.publicKey
    );

    const lpTokenTransferInstruction = createTransferInstruction(
      recipientTokenAccount.address,
      keypair.publicKey,
      amountToDepositToken * Math.pow(10, tokenAccount.account.data.parsed.info.tokenAmount.decimals),
      [],
      TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction().add(approveInstruction, solTransferInstruction, lpTokenTransferInstruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);

    console.log('Liquidity added successfully. Signature:', signature);

    const lpTokenAccount = await connection.getParsedTokenAccountsByOwner(
      keypair.publicKey,
      { mint: liquidityPoolProgramId }
    );

    if (lpTokenAccount.value.length === 0) {
      console.error('No LP token accounts found.');
      return;
    }

    const lpTokenBalance = lpTokenAccount.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    console.log('LP Tokens received:', lpTokenBalance);
  } catch (error) {
    console.error('Error adding liquidity:', error);
  }
}

addLiquidity().catch(err => {
  console.error('Error adding liquidity:', err);
});
