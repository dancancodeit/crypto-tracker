import { CompiledInstruction, ConfirmedTransactionMeta, MessageCompiledInstruction, PublicKey } from "@solana/web3.js";

export interface Market {
    programId: string;
    subscriptionId: number
    id: number;
    getInstructions: () => InstructionInterface<any>[];
}

export interface InstructionInterface<T> {
    transform: (instruction: MessageCompiledInstruction, accountKeys: PublicKey[]) => T;
    transformInner: (innerInstruction: CompiledInstruction, accountKeys: PublicKey[], meta?: ConfirmedTransactionMeta) => T;
    handle: (arg0: T) => void;
    isTransaction: (data: Buffer) => boolean;
    isInnerTransaction: (data: string) => boolean;
    isLogMatch: (log: string) => boolean;
}
