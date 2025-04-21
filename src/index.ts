import WebSocket from 'ws';
import { Connection, PublicKey } from '@solana/web3.js';
import { base58_to_binary } from 'base58-js';
import jsonInput from '../lognotification.json' with { type: 'json' }
import { Market } from './handlers/Market';
import { RaydiumAMM } from './handlers/raydium_amm'
// const websocketURL = "wss://api.mainnet-beta.solana.com";
const websocketURL = "wss://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5";
const PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');
const connection = new Connection('https://api.mainnet-beta.solana.com');
const lamportPerSol = 10 ** -9;
const scale = 1_000_000_000_000_000n;
const usdQuote = 12497


const subscribeRequest = (id: number, programId: string) => (JSON.stringify({
    "jsonrpc": "2.0",
    "id": id,
    "method": "logsSubscribe",
    "params": [
        { mentions: [programId] },
        { commitment: "finalized" }
    ]
}));

const processTransaction = async (data: any, handlers: Market[]) => {
    const dataString = data.toString('utf8');
    const parsedData = JSON.parse(dataString);
    let targetHandler: Market | undefined;

    if (parsedData.id) {
        targetHandler = handlers.find((handler) => handler.id === parsedData.id);
        if (!targetHandler) {
            return;
        }
        targetHandler.subscriptionId = parsedData.subscription;
        return;
    }

    // get market handler for the subscriptionId
    targetHandler = handlers.find((handler) => handler.subscriptionId === parsedData.subscription);

    if (!targetHandler) {
        return;
    }
    // loop through logs, return if no log matches
    let foundLogPhrase = '';
    let targetInstructionHandler;
    for (const log of parsedData.params.result.value.logs) {
        const instructionHandlers = targetHandler.getInstructions();
        for (const instructionHandler of instructionHandlers) {
            if (log.toLowerCase() === instructionHandler.instructionName.toLowerCase()) {
                foundLogPhrase = instructionHandler.instructionName;
                targetInstructionHandler = instructionHandler;
            }
        }
    }

    if (!foundLogPhrase || !targetInstructionHandler) {
        return;
    }

    // if log found, fetch rest of the transaction
    const signature = parsedData.params.result.value.signature;
    const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
    });
    if (!tx) { return }

    // get transaction account and data (use the identifier to identify transaction)

    // transform
    const payload = targetInstructionHandler.transform(null)

    // pass to handler
    targetInstructionHandler.handle(payload);
}

const retryConnection = () => { }

const connectSocket = (handlers: Market[]) => {
    console.log('starting socket');
    const ws = new WebSocket(websocketURL);

    ws.on('open', () => {
        for (const handler of handlers) {
            console.log(`subscribing to ${handler.programId}`);
            ws.send(subscribeRequest(handler.id, handler.programId));
        }
    });

    ws.on('message', async (data) => {
        console.log('processing transaction');
        processTransaction(data, handlers);
    });

    ws.on('close', async () => {
        console.log('retrying connection');
        retryConnection();
    });
}


// register handlers
const handlers: Market[] = [new RaydiumAMM(1)];

// initialize connection
connectSocket(handlers);


