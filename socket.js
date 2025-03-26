const WebSocket = require('ws');
const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');

const websocketURL = "wss://api.mainnet-beta.solana.com";

const ws = new WebSocket(websocketURL);
const idl = require('./idl.json');
const PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');

const connection = new Connection('https://api.mainnet-beta.solana.com');

const subscribeRequest = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "programSubscribe",
    "params": [
      "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C",
      {
        "encoding": "jsonParsed"
      }
    ]
  };

const program = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');
const provider = new anchor.AnchorProvider(connection, {}, { commitment: 'confirmed' });
const program = new anchor.Program(idl, PROGRAM_ID, provider);

ws.on('open', () => {
    ws.send(JSON.stringify(subscribeRequest));
});

ws.on('message', (data) => {
    const dataString = data.toString('utf8');
    const parsedData = JSON.parse(dataString);

    if (parsedData.params?.result?.value?.account?.data) {
        const buff = Buffer.from(parsedData.params.result.value.account.data[0], 'base64');
        //console.log(`First byte: ${decodedData[0].toString(16)}`);
        const decodedInstructions = program.decodeInstruction(buff); 
        // console.log(decodedData.toString('hex'));
        console.log(decodedInstructions);
    }

    console.log(JSON.stringify(parsedData));

});




// const { Buffer } = require('buffer');
// const bs58 = require('bs58');


// // Convert hex string to buffer
// const decodedData = Buffer.from(encodedData, 'hex');

// // Parse liquidity pool data based on known Raydium LP struct
// const pool = {
//   status: decodedData.readUInt32LE(0),  
//   nonce: decodedData.readUInt32LE(4),  
//   tokenMintA: bs58.default.encode(decodedData.slice(8, 40)),  
//   tokenMintB: bs58.default.encode(decodedData.slice(40, 72)),  
//   reserveA: decodedData.readBigUInt64LE(72),  
//   reserveB: decodedData.readBigUInt64LE(80),  
//   lpMint: bs58.default.encode(decodedData.slice(88, 120)),  
//   fees: decodedData.readUInt32LE(160),  
// };

// console.log(pool);


// const decodedData = Buffer.from("9+3j9dfD3kazIT+6i/nIf6keR4GWKMOD4AvqfpjHoD4DuhBpz8P285ixitaDqX3ft6rM7Wwy/cDtv1J3MtSQjtzXBCrVzrKwxcSTtMXHzxP/qh5brK8vb66g4iCW646pSOZf8wH0wpzS99yCu4l2Ij2qHNjeBAIZClm5swlGdAsrgM1L+bmyPEqUCjM3kL12PE99FH672Zgl8PzyYnJ8l4gEhDNw2sVXBpuIV/6rgYT7aH9jRhjANdrEOdwa6ztVmKDwAAAAAAHetKECmiPJaXaXxgeJrjgl1rHvdGylJMVQgjhHSnQW3gbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkXQ5YBagJTnL10KsvemHUInvcC46IZ03gnM51MzX8v2P0ACQkJl9JPc4edAAC5SBoCAAAAAOMpp/UW1AEAN1U9AQAAAADCsAceqREBACqNq2cAAAAA+QIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==", "base64");
// console.log(decodedData.toString('hex'));
