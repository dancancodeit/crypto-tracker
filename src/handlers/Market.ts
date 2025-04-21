export interface Market {
    programId: string;
    subscriptionId: number
    id: number;
    getInstructions: () => InstructionInterface<any>[];
}

export interface InstructionInterface<T> {
    instructionIdentifier: string;
    instructionName: string;
    transform: (arg0: any) => T;
    handle: (arg0: T) => void;
    isTransaction: (data: number[]) => boolean;
}
