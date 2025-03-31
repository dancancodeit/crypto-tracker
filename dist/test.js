import tx from '../run.json' with { type: 'json' };
for (const instruction of tx.transaction.message.compiledInstructions) {
    // console.log(instruction.data.data);
    const buffer = Buffer.from(instruction.data.data);
    if (buffer.byteLength > 8 && buffer.readBigUInt64LE(0) === 17121445590508351407n) {
        console.log('descripter match');
    }
}
const initializTx = tx.transaction.message.compiledInstructions[4];
const buff = Buffer.from(initializTx.data.data);
const descriptor = buff.readBigUInt64LE(0);
const initAmount0 = buff.readBigUInt64LE(8);
const initAmount1 = buff.readBigUInt64LE(16);
const openTime = buff.readBigUInt64LE(24);
const tokenAddress0 = tx.transaction.message.staticAccountKeys[initializTx.accountKeyIndexes[4]];
const tokenAddress1 = tx.transaction.message.staticAccountKeys[initializTx.accountKeyIndexes[5]];
const tokenValult0 = tx.transaction.message.staticAccountKeys[initializTx.accountKeyIndexes[10]];
const tokenValult1 = tx.transaction.message.staticAccountKeys[initializTx.accountKeyIndexes[11]];
console.log(tokenAddress0);
console.log(tokenAddress1);
console.log(tokenValult0);
console.log(tokenValult1);
console.log(descriptor);
console.log(initAmount0);
console.log(initAmount1);
console.log(openTime);
// for (const instruction of testTransaction.transaction.message.compiledInstructions) {
//     if (instruction.programIdIndex === 14) {
//         const buff = Buffer.from(instruction.data.data);
//         const descriptor = buff.readBigUInt64LE(0);
//         const initAmount0 = buff.readBigUInt64LE(8);
//         const initAmount1 = buff.readBigUInt64LE(16);
//         const openTime = buff.readBigUInt64LE(24);
//         console.log("descriptor:", descriptor.toString());
//         console.log("initAmount0:", initAmount0.toString());
//         console.log("initAmount1:", initAmount1.toString());
//         console.log("openTime:", openTime.toString());
//     }
// }
