import { CompiledInstruction, ConfirmedTransactionMeta, MessageCompiledInstruction, PublicKey } from "@solana/web3.js";

export type Context = {
    trackedTokens: string[];
}

export interface Market {
    programId: string;
    subscriptionId: number
    id: number;
    getInstructions: () => InstructionInterface<any>[];
    context: Context;
}

export interface InstructionInterface<T> {
    transform: (instruction: MessageCompiledInstruction, accountKeys: PublicKey[], context: Context) => Promise<T | undefined>;
    transformInner: (innerInstruction: CompiledInstruction, accountKeys: PublicKey[], context: Context, meta?: ConfirmedTransactionMeta) => Promise<T | undefined>;
    handle: (arg0: T, context: Context) => Promise<void>;
    isTransaction: (data: Uint8Array) => boolean;
    isInnerTransaction: (data: string) => boolean;
    isLogMatch: (log: string) => boolean;
}
