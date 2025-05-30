import { Connection, PublicKey } from "@solana/web3.js";

export const lamportPerSol = 10 ** -9;
export const scale = 1_000_000_000_000_000n;
export const usdQuote = 12497
export const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';


//TODO: add static connection?
export const fetchLargestHolders = async (tokenAddress: PublicKey, connection: Connection) => {
        const largestAccounts = (await connection.getTokenLargestAccounts(tokenAddress)).value;
        return largestAccounts;
}
