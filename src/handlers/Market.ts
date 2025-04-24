export interface Market {
    programId: string;
    subscriptionId: number
    id: number;
    getInstructions: () => InstructionInterface<any>[];
}

export interface InstructionInterface<T> {
    transform: (instruction: any, accountKeys: any) => T;
    transformInner: (innerInstruction: any, accountKeys: any) => T;
    handle: (arg0: T) => void;
    isTransaction: (data: Buffer) => boolean;
    isInnerTransaction: (data: string) => boolean;
    isLogMatch: (log: string) => boolean;
}
