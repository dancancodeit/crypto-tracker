import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const signature = '3kxHATE5CsV1zRPuYorvTtdVtiefkNHGzFjYCfd9RjAc1Qu5fgyvvuYPYWGdpdS6ANuQSbtc6jTTscSja3ZU9R8i';
console.log('fetching tx');

const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0
});
if (!tx) {
    console.log('tx not found');
}
else {
    console.log('tx found');
    // console.log(tx);
    const initializTx = tx.transaction.message.compiledInstructions.find(el => {
        const identifer = [175, 175, 109, 31, 13, 152, 155, 237];
        return el.data.slice(0, 8).every((byt, i) => byt === identifer[i]);

    });
    if (initializTx) {
        console.log('instruction found');
        const buff = Buffer.from(initializTx.data);
        console.log(initializTx.data);
        if (buff.byteLength === 32) {
            const initAmount0 = buff.readBigUInt64LE(8);
            const initAmount1 = buff.readBigUInt64LE(16);
            const initAmount2 = buff.readBigUInt64LE(24);
            const tokenAddress1 = tx.transaction.message.staticAccountKeys[initializTx.accountKeyIndexes[5]];
            console.log(initAmount0, initAmount1, initAmount2, tokenAddress1.toString());
        }
    }
    else {
        console.log('instruction not found');
    }

}


