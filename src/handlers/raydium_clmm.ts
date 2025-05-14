import { CompiledInstruction, ConfirmedTransactionMeta, MessageCompiledInstruction, PublicKey } from "@solana/web3.js";
import { Context, InstructionInterface, Market } from "./Market";

type CLMMPayload = {

}

export class CLMMInitInstructionHandler implements InstructionInterface<CLMMPayload> {
        INSTRUCTION_IDENTIFIER_HEX = 'e992d18ecf6840bc';

        async transform(instruction: MessageCompiledInstruction, accountKeys: PublicKey[], context: Context) {
                console.log('transforming createPool');
                //TODO: esketit
                return {};
        }

        async transformInner(innerInstruction: CompiledInstruction, accountKeys: PublicKey[], context: Context, meta?: ConfirmedTransactionMeta) {
                return undefined;
        }

        async handle(arg: CLMMPayload, context: Context) {
                return;
        }

        isTransaction(data: Uint8Array) {
                const dataHexIdentifier = Buffer.from(data).toString('hex', 0, 8);;
                return dataHexIdentifier === this.INSTRUCTION_IDENTIFIER_HEX;
        }

        isInnerTransaction(data: string) { return true; }

        isLogMatch(log: string) {
                return log === 'Program log: Instruction: CreatePool'
        }

}

export class RaydiumCLMMMarket implements Market {
        programId: string;
        id: number;
        subscriptionId: number;

        constructor(id: number) {
                this.id = id;
                this.programId = 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK';
                this.subscriptionId = 0;
        }

        getInstructions() {
                return [new CLMMInitInstructionHandler()]
        }
}
