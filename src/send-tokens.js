require('dotenv').config()
const {
    Connection,
    Keypair,
    Transaction,
    sendTransaction,
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js');

const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const contractAddress = process.env.TOKEN_ADDRESS
const programId = process.env.PROGRAM_ID

const bs58 = require('bs58');

// Replace this with the private key of the sender's address in base58 format
const senderPrivateKeyBase58 = process.env.PRIVATE_KEY;
const senderPrivateKey = bs58.decode(senderPrivateKeyBase58);

const solanaServer = process.env.SOLANA_RPC_SERVER

// Replace this with the token account address of the token you want to send
const tokenAccountAddress = contractAddress;

// Replace these with the recipient addresses
const recipientAddresses = [
    process.env.WALLET_1,
    process.env.WALLET_2,
    process.env.WALLET_3,
    process.env.WALLET_4,
    process.env.WALLET_5,
    process.env.WALLET_6,
    process.env.WALLET_7,
    process.env.WALLET_8,
    process.env.WALLET_9,
    process.env.WALLET_10,
    process.env.WALLET_11,
    process.env.WALLET_12,
    process.env.WALLET_13,
    process.env.WALLET_14,
    process.env.WALLET_15,
    process.env.WALLET_16,
    process.env.WALLET_17,
    process.env.WALLET_18,
    process.env.WALLET_19,
    process.env.WALLET_20,
    // Add more recipient addresses as needed
];

// Create a connection to the Solana cluster
const connection = new Connection(solanaServer);

// Create a keypair from the sender's private key
const senderKeypair = Keypair.fromSecretKey(senderPrivateKey);

async function sendTransactions() {
    try {
        // Get token balance of the sender's address
        const senderTokenAccount = await connection.getParsedTokenAccountsByOwner(senderKeypair.publicKey, { programId: TOKEN_PROGRAM_ID });
        const senderTokenBalance = senderTokenAccount.value.find(account => account.pubkey.equals(new PublicKey(tokenAccountAddress))).account.data.parsed.info.tokenAmount.uiAmount;

        // Calculate amount to send to each recipient
        const amountToSend = senderTokenBalance / recipientAddresses.length;

        for (const recipientAddress of recipientAddresses) {
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: senderKeypair.publicKey,
                    toPubkey: new PublicKey(recipientAddress),
                    lamports: amountToSend,
                })
            );

            const signature = await sendTransaction(connection, transaction, [senderKeypair]);
            console.log(`Sent ${amountToSend} tokens to ${recipientAddress} (Signature: ${signature})`);
        }
    } catch (error) {
        console.error(`Error sending transactions:`, error);
    }
}

sendTransactions();
