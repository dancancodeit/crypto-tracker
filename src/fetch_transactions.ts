import { Address, address, createSolanaRpc } from "@solana/kit";

const startDate = new Date();
const endDate = new Date();

const rpc_url = '';
const rpc = createSolanaRpc(rpc_url);
const addr = address('');

const fetchTransactions = async (start: Date, end: Date, addr: Address) => {
        let fetching = true;
        while (fetching) {
        }
}

await fetchTransactions(startDate, endDate, addr);

