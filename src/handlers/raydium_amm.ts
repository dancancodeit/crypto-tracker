import { CompiledInstruction, ConfirmedTransactionMeta, Connection, MessageCompiledInstruction, PublicKey } from '@solana/web3.js';
import { Market, InstructionInterface, Context } from './Market';
import { scale, lamportPerSol, usdQuote } from '../price_utils';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';

export interface InitPayload { }
export interface SwapPayload { }

class SwapInstruction implements InstructionInterface<SwapPayload> {
        async transform(arg0: MessageCompiledInstruction, arg1: PublicKey[]) { };
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

                console.log({
                        inputToken,
                        outputToken,
                        preInputTokenBalance,
                        postInputTokenBalance,
                        preOutputTokenBalance,
                        postOutputTokenBalance
                });
        }
        handle(arg0: SwapPayload) { };
        isTransaction(data: Buffer) { return false };
        isInnerTransaction = (data: string) => {
                // const hexOut = Buffer.from('37d96256a34ab4ad', 'hex'); // SwapBaseOutput
                const hexIn = Buffer.from('8fbe5adac41e33de', 'hex'); // SwapBaseInput
                const instructionData = bs58.decode(data).slice(0, 8);
                return hexIn.equals(instructionData);
        }
        isLogMatch(log: string) {
                return !!log.match(/Program log: Instruction: SwapBaseInput/);
        };
}

class InitInstruction implements InstructionInterface<InitPayload> {
        instruction = [175, 175, 109, 31, 13, 152, 155, 237];
        connection: Connection;
        transformInner = async (innerInstruction: CompiledInstruction, accountKeys: PublicKey[]) => ({});
        transform = async (arg0: MessageCompiledInstruction, arg1: PublicKey[]) => {
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
        isTransaction = (data: Buffer) => {
                return data.slice(0, 8).every((byte, i) => byte === this.instruction[i]);
        }
        isInnerTransaction = (data: string) => false;
        isLogMatch = (log: string) => {
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
        context: Context = {};

        getInstructions = () => ([
                // new InitInstruction(this.connection),
                new SwapInstruction()
        ]);
        constructor(id: number, connection: Connection) {
                this.id = id;
                this.connection = connection;
                this.context = {};
        }
}
