import WebSocket from 'ws';
import { CompiledInstruction, Connection, PublicKey } from '@solana/web3.js';
import { Market } from './handlers/Market';
import { RaydiumAMM } from './handlers/raydium_amm'
// const websocketURL = "wss://api.mainnet-beta.solana.com";
const websocketURL = "wss://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5";
const PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');
const connection = new Connection('https://api.mainnet-beta.solana.com');

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

    // register subscription ID
    if (parsedData.id) {
        console.log('registering subscription');
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
    let targetInstructionHandler;
    const instructionHandlers = targetHandler.getInstructions();
    for (const log of parsedData.params.result.value.logs) {
        for (const instructionHandler of instructionHandlers) {
            if (instructionHandler.isLogMatch(log)) {
                targetInstructionHandler = instructionHandler;
            }
        }
    }
    if (!targetInstructionHandler) {
        return;
    }
    console.log('log found');
    // if log found, fetch rest of the transaction
    const signature = parsedData.params.result.value.signature;
    const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
    });
    if (!tx) { return }
    console.log('tx found');

    // get transaction account and data (use the identifier to identify transaction)
    console.log(tx.transaction.message.compiledInstructions);
    const instruction = tx.transaction.message.compiledInstructions.find((inst) => targetInstructionHandler.isTransaction(inst.data));
    let locatedInnerInstruction: CompiledInstruction | undefined;
    for (const innerInstruction of tx.meta?.innerInstructions || []) {
        for (const instruction of innerInstruction.instructions) {
            // if (targetInstructionHandler.isInnerTransaction(instruction.data)) {
            // locatedInnerInstruction = instruction;
            // }
        }
    }
    const accountKeys = tx.transaction.message.staticAccountKeys;
    // if (!instruction) { return }
    if (!instruction && !locatedInnerInstruction) { return }

    console.log('transforming');
    // transform
    const payload = await targetInstructionHandler.transform(instruction, accountKeys);

    // pass to handler
    targetInstructionHandler.handle(payload);
}

const retryConnection = () => {
    setTimeout(connectSocket, 2000);
}

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
        processTransaction(data, handlers);
    });
    ws.on('close', async () => {
        console.log('retrying connection');
        retryConnection();
    });
}


// register handlers
const handlers: Market[] = [new RaydiumAMM(1, connection)];
// initialize connection
connectSocket(handlers);
console.log('app started');

