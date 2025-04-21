import { Market, InstructionInterface } from './Market';

export interface InitPayload { }

class InitInstruction implements InstructionInterface<InitPayload> {
    instructionIdentifier: string = '';
    instructionName: string = 'Initialize';
    transform = (arg0: any, arg1: any) => ({});
    handle = (arg0: InitPayload) => { };
    isTransaction = (data: number[]) => true;
}

export class RaydiumAMM implements Market {
    programId = 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C';
    getInstructions = () => ([new InitInstruction]);
    subscriptionId = 0;
    id: number;

    constructor(id: number) {
        this.id = id;
    }

}
