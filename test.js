import WebSocket from 'ws';
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import testTransaction from './test_transaction.json' with { type: 'json' };

for (const instruction of testTransaction.transaction.message.compiledInstructions) {
    if (instruction.programIdIndex === 14) {
        const buff = Buffer.from(instruction.data.data);
        
        const descriptor = buff.readBigUInt64LE(0);
        const initAmount0 = buff.readBigUInt64LE(8);
        const initAmount1 = buff.readBigUInt64LE(16);
        const openTime = buff.readBigUInt64LE(24);

        console.log("descriptor:", descriptor.toString());
        console.log("initAmount0:", initAmount0.toString());
        console.log("initAmount1:", initAmount1.toString());
        console.log("openTime:", openTime.toString());
    }
}

