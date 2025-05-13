import { Address, address, createSolanaRpc, GetTransactionApi, Signature } from "@solana/kit";
import { UnixTimestamp, Commitment, TransactionError, Slot } from "@solana/kit";

// 10 seconds ago in seconds
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
                // current time in seconds
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

const retryClient = async (action: () => Promise<any>) => {
        let delay = 1000;
        while (1) {
                try {
                        return await action();
                }
                catch (e) {
                        console.log(`error ${e}: retrying in ${delay}`);
                        await new Promise(res => setTimeout(res, delay));
                        delay = delay * 2;
                        continue;
                }
        }
}

type TransactionType = Awaited<ReturnType<GetTransactionApi['getTransaction']>>;
const processSignatures = async (signatures: SignatureType[]) => {
        console.log('processing signatures');
        const sigArr = signatures.map(sig => sig.signature);
        const transactions: TransactionType[] = [];
        for (const [i, sig] of sigArr.entries()) {
                console.log(`trying ${i + 1} / ${sigArr.length}`);
                const transaction = await retryClient(async () => (
                        await rpc.getTransaction(sig, { maxSupportedTransactionVersion: 0 }).send()
                ));
                transactions.push(transaction);
        }
        return transactions;
}

const signatures = await fetchSignatures(addr, startDate);
console.log(signatures.length);
const transactions = await processSignatures(signatures);
console.log(transactions);

