import WebSocket from 'ws';
import { CompiledInstruction, Connection } from '@solana/web3.js';
import { InstructionInterface, Market } from './handlers/Market';
import { RaydiumAMM } from './handlers/raydium_amm'
import PQueue from 'p-queue';
import { getRedisClient } from './lib/redisClient';
import { RaydiumCLMMMarket } from './handlers/raydium_clmm';

// const websocketURL = "wss://api.mainnet-beta.solana.com";
const websocketURL = "wss://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5";
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5');

const queue = new PQueue({
        interval: 1000,
        intervalCap: 8
});
const subscribeRequest = (id: number, programId: string) => (JSON.stringify({
        "jsonrpc": "2.0",
        "id": id,
        "method": "logsSubscribe",
        "params": [
                { mentions: [programId] },
                { commitment: "finalized" }
        ]
}));

const processTransaction = async (data: WebSocket.Data, handlers: Market[]) => {
        const dataString = data.toString('utf8');
        const parsedData = JSON.parse(dataString);
        let targetHandler: Market | undefined;
        const context = { redis: await getRedisClient() };

        // register subscription ID (if this was a response from register then it comes back with an id. save it to the appropriate handler)
        if (parsedData.id) {
                targetHandler = handlers.find((handler) => handler.id === parsedData.id);
                if (!targetHandler) {
                        return;
                }
                console.log(`received subscription response for ${parsedData.id} to ${targetHandler.programId} handler`);
                return;
        }

        // get market handler for the subscriptionId
        targetHandler = handlers.find((handler) => handler.id === parsedData.subscription);

        if (!targetHandler) {
                return;
        }

        if (parsedData.params.result.value.err) {
                return;
        }
        // loop through logs, return if no log matches
        let targetInstructionHandler: InstructionInterface<any> | undefined;
        const instructionHandlers = targetHandler.getInstructions();
        const regex = new RegExp(`Program\\s+${targetHandler.programId}\\s+invoke\\s+\\[(\\d+)\\]`);
        for (const [i, log] of parsedData.params.result.value.logs.entries()) {
                const match = log.match(regex);
                if (match) {
                        // TODO: use keys to find instruction handler 
                        for (const instructionHandler of instructionHandlers) {
                                if (instructionHandler.isLogMatch(parsedData.params.result.value.logs[i + 1])) {
                                        console.log(`identified ${parsedData.params.result.value.logs[i + 1]}`);
                                        targetInstructionHandler = instructionHandler;
                                }
                        }

                }
        }
        if (!targetInstructionHandler) {
                return;
        }
        // if log found, fetch rest of the transaction
        const signature = parsedData.params.result.value.signature;
        const tx = await connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0
        });
        if (!tx) { return }
        console.log(`tx found ${signature}`);

        // get transaction account and data (use the identifier to identify transaction)
        const instruction = tx.transaction.message.compiledInstructions.find((inst) => targetInstructionHandler.isTransaction(inst.data));
        let locatedInnerInstruction: CompiledInstruction | undefined;
        for (const innerInstruction of tx.meta?.innerInstructions || []) {
                for (const instruction of innerInstruction.instructions) {
                        if (targetInstructionHandler.isInnerTransaction(instruction.data)) {
                                locatedInnerInstruction = instruction;
                        }
                }
        }
        const accountKeys = tx.transaction.message.staticAccountKeys;
        if (!instruction && !locatedInnerInstruction) { return }

        // transform
        let payload;
        if (instruction) {
                payload = await targetInstructionHandler.transform(instruction, [...accountKeys, ...tx.meta?.loadedAddresses?.writable || [], ...tx.meta?.loadedAddresses?.readonly || []], context);
        }
        else if (locatedInnerInstruction && tx.meta && tx.meta.loadedAddresses) {
                payload = await targetInstructionHandler.transformInner(locatedInnerInstruction, [...accountKeys, ...tx.meta.loadedAddresses.writable, ...tx.meta.loadedAddresses.readonly], context, tx.meta);
        }
        if (!payload) return;
        // pass to handler
        targetInstructionHandler.handle(payload, context);
}

const retryConnection = () => {
        setTimeout(() => connectSocket(handlers), 2000);
}

const connectSocket = (handlers: Market[]) => {
        console.log('starting socket');
        const ws = new WebSocket(websocketURL);
        ws.on('open', () => {
                for (const handler of handlers) {
                        console.log(`sending subscription request for to ${handler.programId} with id ${handler.id}`);
                        ws.send(subscribeRequest(handler.id, handler.programId));
                }
        });
        ws.on('message', async (data) => {
                await queue.add(() => processTransaction(data, handlers));
        });
        ws.on('close', async () => {
                console.log('retrying connection');
                retryConnection();
        });
}


// register handlers
const handlers: Market[] = [new RaydiumAMM(1, connection), new RaydiumCLMMMarket(2)];
// initialize connection
connectSocket(handlers);
console.log('app started');

