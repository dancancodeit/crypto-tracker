import { CompiledInstruction, ConfirmedTransactionMeta, Connection, MessageCompiledInstruction, PublicKey } from '@solana/web3.js';
import { Market, InstructionInterface, Context } from './Market';
import { scale, lamportPerSol, usdQuote, SOL_ADDRESS } from '../price_utils';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import fs from 'fs';

export interface InitPayload {
        // baseTokenPrice: string,
        // baseTokenSupply: string,
        baseTokenAddress: string,
        // baseTokenSupplyAmount: string,
}
export interface SwapPayload { }

class SwapInstruction implements InstructionInterface<SwapPayload> {
        async transform(arg0: MessageCompiledInstruction, arg1: PublicKey[]) {
                return { baseTokenAddress: '' };
        };
        transformInner = async (transaction: CompiledInstruction, accountKeys: PublicKey[], context: Context, meta?: ConfirmedTransactionMeta) => {
                const data = bs58.decode(transaction.data);
                const amountIn = data.readBigUInt64LE(8);
                const minAmountOut = data.readBigUInt64LE(16);

                const inputToken = accountKeys[transaction.accounts[10]].toString();
                const outputToken = accountKeys[transaction.accounts[11]].toString();

                const inputTokenDecimal = meta?.preTokenBalances?.find(tb => tb.mint === inputToken)?.uiTokenAmount.decimals;
                const preInputTokenBalance = meta?.preTokenBalances?.find(tb => tb.mint === inputToken)?.uiTokenAmount.amount;
                const postInputTokenBalance = meta?.postTokenBalances?.find(tb => tb.mint === inputToken)?.uiTokenAmount.amount;

                const outputTokenDecimal = meta?.preTokenBalances?.find(tb => tb.mint === outputToken.toString())?.uiTokenAmount.decimals;
                const preOutputTokenBalance = meta?.preTokenBalances?.find(tb => tb.mint === outputToken.toString())?.uiTokenAmount.amount;
                const postOutputTokenBalance = meta?.postTokenBalances?.find(tb => tb.mint === outputToken.toString())?.uiTokenAmount.amount;

                let trackedToken: string | undefined;
                let transactionType: string | undefined;
                if (inputToken === SOL_ADDRESS) {
                        transactionType = 'BUY';
                        trackedToken = outputToken;
                }
                else {
                        transactionType = 'SELL';
                        trackedToken = inputToken;
                }

                if (!await context.redis.sIsMember('tracked_tokens', trackedToken)) { return }

                return {
                        inputToken,
                        outputToken,
                        preInputTokenBalance,
                        postInputTokenBalance,
                        preOutputTokenBalance,
                        postOutputTokenBalance

                };
        }
        async handle(payload: SwapPayload) {
                console.log(payload);
                fs.appendFileSync('transactions.out', JSON.stringify(payload) + '\n');
                return;
        };
        isTransaction(data: Uint8Array) { return false };
        isInnerTransaction = (data: string) => {
                // const hexOut = Buffer.from('37d96256a34ab4ad', 'hex'); // SwapBaseOutput
                const buff = Buffer.from('8fbe5adac41e33de', 'hex'); // SwapBaseInput
                const instructionData = bs58.decode(data).slice(0, 8);
                return buff.equals(instructionData);
        }
        isLogMatch(log: string) {
                return !!log.match(/Program log: Instruction: SwapBaseInput/);
        };
}

class InitInstruction implements InstructionInterface<InitPayload> {
        instruction = [175, 175, 109, 31, 13, 152, 155, 237];
        connection: Connection;
        transformInner = async (innerInstruction: CompiledInstruction, accountKeys: PublicKey[]) => ({
                baseTokenAddress: ''
        });
        transform = async (messageInstruction: MessageCompiledInstruction, accountKeys: PublicKey[]) => {
                const buff = Buffer.from(messageInstruction.data);
                if (buff.byteLength !== 32) {
                        return;
                }
                if (messageInstruction.accountKeyIndexes.length !== 20) {
                        console.log('wrong accountKey Size');
                        return;
                }
                const initAmount0 = buff.readBigUInt64LE(8);
                const initAmount1 = buff.readBigUInt64LE(16);
                const tokenAddress0 = accountKeys[messageInstruction.accountKeyIndexes[4]];
                const tokenAddress1 = accountKeys[messageInstruction.accountKeyIndexes[5]];

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
                        console.log('couldn\'t find token details');
                        return;
                }
                const decimals = quoteTokenDetails.value.decimals;
                const price = this.computePrices(
                        BigInt(amounts[baseTokenIdx]),
                        BigInt(amounts[quoteTokenIdx]),
                        BigInt(scale),
                        BigInt(decimals));
                // SOL in lamports * USD quote in pennies * 10^-2 * 2 * sol per lamports
                const liquidityValInSol = Number(amounts[quoteTokenIdx]) * (usdQuote * 10 ** -2) * 2 * Number(lamportPerSol);

                return {
                        baseTokenPrice: price.toString(),
                        baseTokenSupplyVal: liquidityValInSol,
                        baseTokenAddress: tokens[baseTokenIdx].toString(),
                        baseTokenSupply: amounts[baseTokenIdx].toString()
                };
        };
        handle = async (payload: InitPayload, context: Context) => {
                context.redis.sAdd('tracked_tokens', payload.baseTokenAddress);
                console.log('handling');
        };
        isTransaction = (data: Uint8Array) => {
                return data.slice(0, 8).every((byte, i) => byte === this.instruction[i]);
        }
        isInnerTransaction = (data: string) => false;
        isLogMatch = (log: string) => {
                return log.toLowerCase() === "Program log: Instruction: Initialize".toLowerCase();
        }
        computePrices = (baseTokenAmount: bigint, quoteTokenAmount: bigint, scale: bigint, decimals: bigint) => {
                // dividing by 10**9 because quote token (SOL) is in lamports. Scale to preserve accuracy
                const numerator = quoteTokenAmount * scale / (10n ** 9n);
                // converting base token to it's whole
                const denominator = baseTokenAmount / 10n ** decimals;
                // compute price per token 
                const result = numerator / denominator;
                // unscale
                return Number(result) / Number(scale);
        }

        constructor(connection: Connection) {
                this.connection = connection;
        }
}

export class RaydiumAMM implements Market {
        programId = 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C';
        connection: Connection;
        id: number;

        getInstructions = () => ([
                new InitInstruction(this.connection),
                // new SwapInstruction()
        ]);
        constructor(id: number, connection: Connection) {
                this.id = id;
                this.connection = connection;
        }
}
