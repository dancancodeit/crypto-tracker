import { Address, address, createSolanaRpc } from "@solana/kit";

const startDate = BigInt(Math.floor(new Date('2025-05-06T16:37:00Z').getTime() / 1000));

const rpc_url = 'https://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5';
const rpc = createSolanaRpc(rpc_url);
const addr = address('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');

const fetchTransactions = async (addr: Address, start: bigint, end?: bigint) => {
        let fetching = true;
        let lastSignatue;
        let allSignatures = [];
        if (!end) {
                end = BigInt(Math.floor(new Date().getTime() / 1000));
        }
        while (fetching) {
                console.log('fetching');
                const sigs = await rpc.getSignaturesForAddress(addr).send();
                const filteredSigs = sigs.filter(sig => {
                        if (!sig.blockTime) {
                                console.log('blockTime not set');
                                return;
                        }
                        if (sig.blockTime <= end && sig.blockTime >= start) {
                                return true;
                        }
                        return true;

                });
                await new Promise(resolve => setTimeout(resolve, 100));
                fetching = false;
                allSignatures.push(...filteredSigs);
        }
        return allSignatures;
}

console.log(await fetchTransactions(addr, startDate));


