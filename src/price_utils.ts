export const lamportPerSol = 10 ** -9;
export const scale = 1_000_000_000_000_000n;
export const usdQuote = 12497
export const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';


//TODO: add static connection?
export const fetchLargestHolders = async (tokenAddress: string) => {
        const largestAccounts = (await this.connection.getTokenLargestAccounts(tokenAddress)).value;
}
