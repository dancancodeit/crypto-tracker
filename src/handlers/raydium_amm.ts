import { Connection } from '@solana/web3.js';
import { Market, InstructionInterface } from './Market';
import { scale, lamportPerSol, usdQuote } from '../price_utils';

export interface InitPayload { }
export interface SwapPayload { }

class SwapInstruction implements InstructionInterface<SwapPayload> {
    async transform(arg0: any, arg1: any) { };
    handle(arg0: SwapPayload) { };
    isTransaction(data: number[]) { return false };
    isLogMatch(log: any) { return false };
}

class InitInstruction implements InstructionInterface<InitPayload> {
    instruction = [175, 175, 109, 31, 13, 152, 155, 237];
    connection: Connection;
    transform = async (arg0: any, arg1: any) => {
        const buff = Buffer.from(arg0.data);
        if (buff.byteLength !== 32) {
            return;
        }

        const initAmount0 = buff.readBigUInt64LE(8);
        const initAmount1 = buff.readBigUInt64LE(16);
        const tokenAddress0 = arg1[arg0.accountKeyIndexes[4]];
        const tokenAddress1 = arg1[arg0.accountKeyIndexes[5]];

        const tokens = [tokenAddress0, tokenAddress1];
        const amounts = [initAmount0, initAmount1];

        const baseTokenIdx = [tokenAddress0, tokenAddress1].findIndex((val) => {
            return val.toString().slice(0, 2) !== 'So'
        });
        const quoteTokenIdx = [tokenAddress0, tokenAddress1].findIndex((val) => {
            return val.toString().slice(0, 2) === 'So'
        });
        const quoteTokenDetails = await this.connection.getTokenSupply(tokens[baseTokenIdx]);
        if (!quoteTokenDetails) {
            return;
        }
        const decimals = quoteTokenDetails.value.decimals;
        const price = this.computePrices(
            BigInt(amounts[baseTokenIdx]),
            BigInt(amounts[quoteTokenIdx]),
            BigInt(scale),
            BigInt(decimals));
        const liquidityValInSol = Number(amounts[quoteTokenIdx]) * (usdQuote * 10 ** -2) * 2 * Number(lamportPerSol);

        return {
            baseTokenPrice: price.toString(),
            baseTokenSupplyVal: liquidityValInSol,
            baseTokenAddress: tokens[baseTokenIdx].toString(),
            baseTokenSupply: amounts[baseTokenIdx].toString()
        };
    };
    handle = (arg0: InitPayload) => {
        console.log('handling');
        console.log(arg0);
    };
    isTransaction = (data: number[]) => {
        return data.slice(0, 8).every((byte, i) => byte === this.instruction[i]);
    }
    isLogMatch = (log: any) => {
        return log.toLowerCase() === "Program log: Instruction: Initialize".toLowerCase();
    }
    computePrices = (baseTokenAmount: bigint, quoteTokenAmount: bigint, scale: bigint, decimals: bigint) => {
        const numerator = quoteTokenAmount * scale / (10n ** 9n);
        const denominator = baseTokenAmount / 10n ** decimals;
        const result = numerator / denominator;
        return Number(result) / Number(scale);
    }

    constructor(connection: Connection) {
        this.connection = connection;
    }
}

export class RaydiumAMM implements Market {
    programId = 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C';
    connection: Connection;
    subscriptionId = 0;
    id: number;

    getInstructions = () => ([
        new InitInstruction(this.connection)
    ]);
    constructor(id: number, connection: Connection) {
        this.id = id;
        this.connection = connection;
    }
}
