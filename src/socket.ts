import WebSocket from 'ws';
import txObj from '../run.json';
import { Connection, PublicKey } from '@solana/web3.js';

const websocketURL = "wss://api.mainnet-beta.solana.com";
const ws = new WebSocket(websocketURL);
const PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');
const connection = new Connection('https://api.mainnet-beta.solana.com');


const subscribeRequest = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "logsSubscribe",
    "params": [
        { mentions: ["CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"] },
        { commitment: "finalized" }
    ]
};

//const program = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');
//const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });

ws.on('open', () => {
    ws.send(JSON.stringify(subscribeRequest));
    console.log('subcription request sent');
});

ws.on('message', async (data) => {
    const dataString = data.toString('utf8');
    const parsedData = JSON.parse(dataString);
    //console.log(dataString);
    // TODO: better check?
    if (parsedData?.params?.result?.value?.signature) {
        //TODO: search through program logs and check for "Initialize" (params->result->value.logs[])
        //check for "Program log: Instruction: Initialize"

        let initTransaction = false;
        for (const log of parsedData.params.result.value.logs) {
            if (log.toLowerCase() === "Program log: Instruction: Initialize".toLowerCase()) {
                initTransaction = true;
                break;
            }
        }
        if (initTransaction) {
            const signature = parsedData.params.result.value.signature;
            const tx = await connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0
            });
            console.log(JSON.stringify(tx));
            //TODO: get reserve A and reserve B, identify SOL then get liquidty value
            
        }
    }
});

// const { Buffer } = require('buffer');

// // Convert hex string to buffer
// const decodedData = Buffer.from(encodedData, 'hex');

// // Parse liquidity pool data based on known Raydium LP struct
// const pool = {
//   status: decodedData.readUInt32LE(0),  
//   nonce: decodedData.readUInt32LE(4),  
//   tokenMintA: bs58.default.encode(decodedData.slice(8, 40)),  
//   tokenMintB: bs58.default.encode(decodedData.slice(40, 72)),  
//   reserveA: decodedData.readBigUInt64LE(72),  
//   reserveB: decodedData.readBigUInt64LE(80),  
//   lpMint: bs58.default.encode(decodedData.slice(88, 120)),  
//   fees: decodedData.readUInt32LE(160),  
// };

