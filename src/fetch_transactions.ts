import { Address, address, createSolanaRpc, Signature } from "@solana/kit";
import { UnixTimestamp, Commitment, TransactionError, Slot } from "@solana/kit";
import { Connection } from "@solana/web3.js";

const startDate = BigInt(Math.floor(new Date(new Date().getTime() - 10000).getTime() / 1000));

const rpc_url = 'https://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5';
const rpc = createSolanaRpc(rpc_url);
const addr = address('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');

type SignatureType = {
        blockTime: UnixTimestamp | null;
        confirmationStatus: Commitment | null;
        err: TransactionError | null;
        memo: string | null;
        signature: Signature;
        slot: Slot;
}

const fetchSignatures = async (addr: Address, start: bigint, end?: bigint) => {
        let fetching = true;
        let lastSignature;
        let allSignatures = [];
        let options: { before: Signature } | undefined;
        if (!end) {
                end = BigInt(Math.floor(new Date().getTime() / 1000));
        }
        while (fetching) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (lastSignature) {
                        options = { before: lastSignature.signature };
                }
                const sigs = await rpc.getSignaturesForAddress(addr, options).send();
                const filteredSigs = sigs.filter(sig => {
                        if (!sig.blockTime) {
                                console.log('blockTime not set');
                                return;
                        }
                        if (sig.blockTime <= end && sig.blockTime >= start) {
                                return true;
                        }
                        return false;

                });
                if (filteredSigs.length > 0) {
                        allSignatures.push(...filteredSigs);
                        lastSignature = sigs[sigs.length - 1];
                }
                else {
                        fetching = false;
                }
        }
        return allSignatures.reverse();
}

const processSignatures = async (signatures: SignatureType[]) => {
        console.log('processing signatures');
        const websocketURL = "https://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5";
        const connection = new Connection(websocketURL);
        // looks like this just throws a bunch of rpc requests
        const transactions = await connection.getTransactions(signatures.map(sig => sig.signature), { maxSupportedTransactionVersion: 0 });
        return transactions;
}

const signatures = await fetchSignatures(addr, startDate);
await processSignatures(signatures);
console.log(signatures.length);

