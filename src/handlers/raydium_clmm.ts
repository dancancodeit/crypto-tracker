import { CompiledInstruction, ConfirmedTransactionMeta, MessageCompiledInstruction, PublicKey } from "@solana/web3.js";
import { Context, InstructionInterface, Market } from "./Market";

type CLMMPayload = {

}
export class CLMMInitInstructionHandler implements InstructionInterface<CLMMPayload> {
        async transform(instruction: MessageCompiledInstruction, accountKeys: PublicKey[], context: Context) {
                return {};
        }
        async transformInner(innerInstruction: CompiledInstruction, accountKeys: PublicKey[], context: Context, meta?: ConfirmedTransactionMeta) {
                return undefined;
        }
        async handle(arg: CLMMPayload, context: Context) {
                return;
        }
        isTransaction(data: Uint8Array) {
                return false;
        }
        isInnerTransaction(data: string) { return true; }
        isLogMatch(log: string) { return false; }

}
