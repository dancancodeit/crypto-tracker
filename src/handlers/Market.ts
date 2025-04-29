import { CompiledInstruction, ConfirmedTransactionMeta, MessageCompiledInstruction, PublicKey } from "@solana/web3.js";

export type Context = {

}

export interface Market {
    programId: string;
    subscriptionId: number
    id: number;
    getInstructions: () => InstructionInterface<any>[];
    context: Context;
}

export interface InstructionInterface<T> {
    transform: (instruction: MessageCompiledInstruction, accountKeys: PublicKey[], context: Context) => T;
    transformInner: (innerInstruction: CompiledInstruction, accountKeys: PublicKey[], context: Context, meta?: ConfirmedTransactionMeta) => T;
    handle: (arg0: T, context: Context) => void;
    isTransaction: (data: Buffer) => boolean;
    isInnerTransaction: (data: string) => boolean;
    isLogMatch: (log: string) => boolean;
}
