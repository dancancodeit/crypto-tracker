import WebSocket from 'ws';
import { Connection, PublicKey } from '@solana/web3.js';
import { base58_to_binary } from 'base58-js';
import jsonInput from '../lognotification.json' with { type: 'json' }
// const websocketURL = "wss://api.mainnet-beta.solana.com";
const websocketURL = "wss://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5";
const ws = new WebSocket(websocketURL);
const PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');
const connection = new Connection('https://api.mainnet-beta.solana.com');
const lamportPerSol = 1_000_000_000n;
const scale = 1_000_000_000_000_000n;
const usdQuote = 12497

const subscribeRequest = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "logsSubscribe",
    "params": [
        { mentions: [PROGRAM_ID] },
        { commitment: "finalized" }
    ]
};

//const program = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');
//const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });

const connectSocket = () => {
    ws.on('open', () => {
        ws.send(JSON.stringify(subscribeRequest));
        console.log('subcription request sent');
    });

    ws.on('message', async (data) => {
        const dataString = data.toString('utf8');
        const parsedData = JSON.parse(dataString);
        processTransaction(parsedData);
    });

    ws.on('close', async () => {
        console.log('retrying connection');
        retryConnection();
    });
}

const retryConnection = () => {
    setTimeout(connectSocket, 2000);
}

const processTransaction = async (parsedData: any) => {
    if (parsedData?.params?.result?.value?.signature && !parsedData?.params?.result?.value?.err) {
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
            if (tx) {
                const initializTx = tx.transaction.message.compiledInstructions.find(el => {
                    const identifer = [175, 175, 109, 31, 13, 152, 155, 237];
                    return el.data.slice(0, 8).every((byt, i) => byt === identifer[i]);

                });
                if (initializTx) {
                    const buff = Buffer.from(initializTx.data);
                    if (buff.byteLength === 32) {
                        const initAmount0 = buff.readBigUInt64LE(8);
                        const initAmount1 = buff.readBigUInt64LE(16);
                        const tokenAddress0 = tx.transaction.message.staticAccountKeys[initializTx.accountKeyIndexes[4]];
                        const tokenAddress1 = tx.transaction.message.staticAccountKeys[initializTx.accountKeyIndexes[5]];

                        const tokens = [tokenAddress0, tokenAddress1];
                        const amounts = [initAmount0, initAmount1];

                        const baseTokenIdx = [tokenAddress0, tokenAddress1].findIndex((val) => {
                            return val.toString().slice(0, 2) !== 'So'
                        });
                        const quoteTokenIdx = [tokenAddress0, tokenAddress1].findIndex((val) => {
                            return val.toString().slice(0, 2) === 'So'
                        });
                        const quoteTokenDetails = await connection.getTokenSupply(tokens[baseTokenIdx]);
                        if (quoteTokenDetails) {
                            const decimals = quoteTokenDetails.value.decimals;
                            const price = computePrices(BigInt(amounts[baseTokenIdx]), BigInt(amounts[quoteTokenIdx]), BigInt(scale), BigInt(decimals));
                            printPrices(price.toString(), tokens[baseTokenIdx].toString(), amounts[baseTokenIdx].toString(), Number(amounts[quoteTokenIdx]) * (usdQuote * 10 ** -2) * 2 * Number(lamportPerSol));
                        }
                    }
                }
            }
        }
    }
}

const computePrices = (baseTokenAmount: bigint, quoteTokenAmount: bigint, scale: bigint, decimals: bigint) => {
    const numerator = quoteTokenAmount * scale / (10n ** 9n);
    const denominator = baseTokenAmount / 10n ** decimals;
    const result = numerator / denominator;
    return Number(result) / Number(scale);
}

const printPrices = (baseTokenPrice: string, baseTokenAddress: string, baseTokenSupply: string, liquidityVal: number) => {
    console.log(`Base Token Price: ${baseTokenPrice} SOL`);
    console.log(`Base Token Supply: ${baseTokenSupply}`);
    console.log(`Initial Liquidity Pool Value: ${liquidityVal} USD`);
    console.log(`Token: ${baseTokenAddress}`);
    console.log('-------------');
}

console.log('app started');
// processTransaction(jsonInput);

