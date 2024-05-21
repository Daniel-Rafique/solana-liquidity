require('dotenv').config();
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
const { writeFileSync } = require('fs');
const bs58 = require('bs58');

const contractAddress = process.env.TOKEN_ADDRESS;
const programId = process.env.PROGRAM_ID;
const solanaServer = process.env.SOLANA_RPC_SERVER;

const tokenMint = new PublicKey(contractAddress);
const liquidityPoolProgramId = new PublicKey(programId);
const connection = new Connection(solanaServer);

const privateKeys = [
  process.env.PRIVATE_KEY_1,
  process.env.PRIVATE_KEY_2,
  // Add all other private keys up to PRIVATE_KEY_20
];

async function addLiquidityForWallet(privateKeyBase58, walletIndex) {
  const privateKey = bs58.decode(privateKeyBase58);
  const keypair = Keypair.fromSecretKey(privateKey);

  console.log(`Processing wallet ${walletIndex + 1}`);

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      keypair.publicKey,
      { mint: tokenMint }
    );

    if (tokenAccounts.value.length === 0) {
      console.error(`No token accounts found for wallet ${walletIndex + 1}`);
      return;
    }

    const tokenAccount = tokenAccounts.value[0];
    const tokenBalance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
    const amountToDepositToken = 1;

    if (tokenBalance < amountToDepositToken) {
      console.error(`Insufficient token balance in wallet ${walletIndex + 1}`);
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

    console.log(`Liquidity added for wallet ${walletIndex + 1}. Signature: ${signature}`);

    const lpTokenAccount = await connection.getParsedTokenAccountsByOwner(
      keypair.publicKey,
      { mint: liquidityPoolProgramId }
    );

    if (lpTokenAccount.value.length === 0) {
      console.error(`No LP token accounts found for wallet ${walletIndex + 1}`);
      return;
    }

    const lpTokenBalance = lpTokenAccount.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    console.log(`LP Tokens received for wallet ${walletIndex + 1}: ${lpTokenBalance}`);

    // Write the LP token balance to a file
    writeFileSync(`lp_token_balance_wallet_${walletIndex + 1}.txt`, `LP Tokens received: ${lpTokenBalance}\n`);
    console.log(`LP token balance written to lp_token_balance_wallet_${walletIndex + 1}.txt`);
  } catch (error) {
    console.error(`Error adding liquidity for wallet ${walletIndex + 1}:`, error);
  }
}

async function addLiquidityForAllWallets() {
  for (let i = 0; i < privateKeys.length; i++) {
    await addLiquidityForWallet(privateKeys[i], i);
  }
}

addLiquidityForAllWallets().catch(err => {
  console.error('Error adding liquidity for all wallets:', err);
});
