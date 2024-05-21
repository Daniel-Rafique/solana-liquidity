Solana Liquidity Pool Interactor
This is a Node.js script that demonstrates how to interact with a liquidity pool on the Solana blockchain. It uses the @solana/web3.js and @solana/spl-token libraries to perform operations such as fetching token accounts, approving token transfers, and sending transactions to the liquidity pool program.
Prerequisites
Before running this script, ensure that you have the following:

Node.js installed on your machine
A Solana wallet with a funded account

Installation

1. Clone this repository:

https://github.com/Daniel-Rafique/solana-liquidity.git

2. Navigate to the project directory:

cd solana-liquidity

3. Install the required dependencies:

npm install

To send token to multiple wallets before adding to the LP run:

npm run tx

Then to send tokens to the liquidity pool and receive your LP token run:

npm run lp 


Explanation
Approve Token Transfer:

The createApproveInstruction function approves the specified amount of tokens for transfer to the liquidity pool program.
Transfer SOL to Pool:

The SystemProgram.transfer function transfers the specified amount of SOL to the liquidity pool program.
Get or Create LP Token Account:

The getOrCreateAssociatedTokenAccount function ensures that an associated token account is created for receiving LP tokens if it doesn't already exist.
Transfer LP Tokens to User:

The createTransferInstruction function handles the transfer of LP tokens to the user's associated token account.
Execute Transaction:

The script creates a transaction that combines these instructions and sends it to the Solana network using sendAndConfirmTransaction.
Verify LP Token Balance:

After the transaction is confirmed, the script fetches and logs the user's LP token balance to verify the receipt of LP tokens.