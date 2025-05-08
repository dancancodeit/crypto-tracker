import { Address, address, createSolanaRpc, Signature } from "@solana/kit";

const startDate = BigInt(Math.floor(new Date(new Date().getTime() - 10000).getTime() / 1000));

const rpc_url = 'https://mainnet.helius-rpc.com/?api-key=cbd49df2-abbf-4bfe-b7a4-dbe53fd90fd5';
const rpc = createSolanaRpc(rpc_url);
const addr = address('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');

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
        return allSignatures;
}

const signatures = await fetchSignatures(addr, startDate);
console.log(signatures.length);

