
// _______                                                 __          __       __                            ________ 
// |       \                                               |  \        |  \     /  \                          |        \
// | ▓▓▓▓▓▓▓\ ______   ______        __  ______   _______ _| ▓▓_       | ▓▓\   /  ▓▓ ______  _______   ______  \▓▓▓▓▓▓▓▓
// | ▓▓__/ ▓▓/      \ /      \      |  \/      \ /       \   ▓▓ \      | ▓▓▓\ /  ▓▓▓|      \|       \ |      \   | ▓▓   
// | ▓▓    ▓▓  ▓▓▓▓▓▓\  ▓▓▓▓▓▓\      \▓▓  ▓▓▓▓▓▓\  ▓▓▓▓▓▓▓\▓▓▓▓▓▓      | ▓▓▓▓\  ▓▓▓▓ \▓▓▓▓▓▓\ ▓▓▓▓▓▓▓\ \▓▓▓▓▓▓\  | ▓▓   
// | ▓▓▓▓▓▓▓| ▓▓   \▓▓ ▓▓  | ▓▓     |  \ ▓▓    ▓▓ ▓▓       | ▓▓ __     | ▓▓\▓▓ ▓▓ ▓▓/      ▓▓ ▓▓  | ▓▓/      ▓▓  | ▓▓   
// | ▓▓     | ▓▓     | ▓▓__/ ▓▓     | ▓▓ ▓▓▓▓▓▓▓▓ ▓▓_____  | ▓▓|  \    | ▓▓ \▓▓▓| ▓▓  ▓▓▓▓▓▓▓ ▓▓  | ▓▓  ▓▓▓▓▓▓▓  | ▓▓   
// | ▓▓     | ▓▓      \▓▓    ▓▓     | ▓▓\▓▓     \\▓▓     \  \▓▓  ▓▓    | ▓▓  \▓ | ▓▓\▓▓    ▓▓ ▓▓  | ▓▓\▓▓    ▓▓  | ▓▓   
//  \▓▓      \▓▓       \▓▓▓▓▓▓ __   | ▓▓ \▓▓▓▓▓▓▓ \▓▓▓▓▓▓▓   \▓▓▓▓      \▓▓      \▓▓ \▓▓▓▓▓▓▓\▓▓   \▓▓ \▓▓▓▓▓▓▓   \▓▓   
//                            |  \__/ ▓▓                                                                                
//                             \▓▓    ▓▓                                                                                
//                              \▓▓▓▓▓▓                                                                                 

const dotenv = require("dotenv").config();
const { ethers } = require("ethers");
const { MerkleTree } = require('merkletreejs');
const addr = require("./addr.json");
const abi = require("./abi.json");                                          

//                    ▄    ██                          
//   ▄▄▄   ▄▄▄ ▄▄▄  ▄██▄  ▄▄▄    ▄▄▄   ▄▄ ▄▄▄    ▄▄▄▄  
// ▄█  ▀█▄  ██▀  ██  ██    ██  ▄█  ▀█▄  ██  ██  ██▄ ▀  
// ██   ██  ██    █  ██    ██  ██   ██  ██  ██  ▄ ▀█▄▄ V   V
//  ▀█▄▄█▀  ██▄▄▄▀   ▀█▄▀ ▄██▄  ▀█▄▄█▀ ▄██▄ ██▄ █▀▄▄█▀  V V
//          ██                                           V
//         ▀▀▀▀                                        

// block produced. Current ethereum block is 15202823 july 24 2022
let targetBlockNumber = 20000000;

// blocktime is expressed in unix / 1000 https://www.epochconverter.com/
// initiate with Number.POSITIVE_INFINITY if listening to initializer
let targetBlockTime = Number.POSITIVE_INFINITY;
let allowlistStartTime = Number.POSITIVE_INFINITY;
let allowlistPrice = ethers.utils.parseUnits("0", "gwei");
let salePrice = ethers.utils.parseUnits("0", "gwei");

// If function depends on owner wallet to identify if certain tx 
// has been called (pendingTxListener.js)
let ownerWallet = "0x...";

// These options must be set manually
let maxFeePerGas = ethers.utils.parseUnits("300", "gwei");
let maxPriorityFeePerGas = ethers.utils.parseUnits("50", "gwei");
let gasLimit = 300000;

const test = true; // if running test mode
const avalanche = true; // if running on avalanche 
const abiFetch = false; // if you want to fetch ABI (requires API KEY from blockscan)
const wsOnly = false; // calling write transactions to WebSocket (disallowed by Avalanche RPC)
const allowlist = true; // if minting to allowlist

abiFetch ? fetchABI() : console.log("abi has been manually set");

// Initialize providers
const wsProvider = new ethers.providers.WebSocketProvider(avalanche ? process.env.WS : process.env.WS_ETH);
const httpProvider = new ethers.providers.JsonRpcProvider(avalanche ? process.env.HTTP : process.env.HTTP_ETH);

// Initialize contract instances
const wsContract = new ethers.Contract(process.env.CONTRACT, abi, wsProvider);
const httpContract = new ethers.Contract(process.env.CONTRACT, abi, httpProvider);

// Intialize signers. Make sure to also alter the amount of wallets minting in snipe() function
const signer1 = await initiateSigner(process.env.PRIVATE_KEY1);
const signer2 = await initiateSigner(process.env.PRIVATE_KEY2);
const signer3 = await initiateSigner(process.env.PRIVATE_KEY3);


//   ▄▀█▄                             ▄    ██                          
// ▄██▄   ▄▄▄ ▄▄▄  ▄▄ ▄▄▄     ▄▄▄▄  ▄██▄  ▄▄▄    ▄▄▄   ▄▄ ▄▄▄    ▄▄▄▄  
//  ██     ██  ██   ██  ██  ▄█   ▀▀  ██    ██  ▄█  ▀█▄  ██  ██  ██▄ ▀  V   V
//  ██     ██  ██   ██  ██  ██       ██    ██  ██   ██  ██  ██  ▄ ▀█▄▄  V V
// ▄██▄    ▀█▄▄▀█▄ ▄██▄ ██▄  ▀█▄▄▄▀  ▀█▄▀ ▄██▄  ▀█▄▄█▀ ▄██▄ ██▄ █▀▄▄█▀   V

// Constructs signer, initiating a wallet instance and getting its nonce
// for quick access to nonce instead of having it retrieved during call
async function initiateSigner(privateKey){
  const wallet = new ethers.Wallet(privateKey, httpProvider);
  const nonce = await wallet.getTransactionCount();
  return [wallet, nonce]
}

// Actionable mint function
async function snipe() {
  console.log("minting"); 
    let contract = wsOnly ? wsContract : httpContract;

    if (!test) {
      const [tx1, tx2, tx3] = await Promise.all([
        //setup as many wallets as you want
        // include the same amount of txs
        // make sure to store&console.log them
        mint(contract, signer1),
        mint(contract, signer2),
        mint(contract, signer3),
      ]);
  
      console.log(await tx1);
      console.log(await tx2);
      console.log(await tx3);
  
      process.exit(0);
    } else {
      // mock mint
      console.log("ran successfully!");
      process.exit(0);
    }
}
// Mint function, constructs the mint call
async function mint(contract, signer) {
  const wallet = signer[0]
  const nonce = signer[1]
  let options = {
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
    value: allowlist ? allowlistPrice : salePrice,
    gasLimit: gasLimit,
    nonce: nonce
  };
  // if it requires parsing a signature, make sure to include it as a param
  // e.g. mintMethod(amount, parseSignature(signer[0].address), options)
  allowlist ? contract.connect(wallet).allowlistMint(amount, options)
            : contract.connect(wallet).publicSaleMint(amount, options)
}

// Listens to block time and mints once current time is above targetBlockTime
async function blockTimeListener() {
  wsProvider.on("block", function (block) {
    let time = Date.now();
    allowlist ? console.log(allowlistStartTime, "allowlist") :
                console.log(publicSaleStartTime, "publicSale");
    console.log(time / 1000, "current time");

    // targetBlockTIme - 1 (will send tx 1 second before tx is actually good) if you have a lot of latency
    targetBlockTime = allowlist ? allowlistStartTime : publicSaleStartTime;
    if (targetBlockTime <= block.timestamp / 1000) {
      console.log("going to mint");
      snipe();
    } else {
      console.log("not yet");
    }
  });
}

// Listen to blocks number
async function blockNumberListener() {
  wsProvider.on("block", (block) => {
    console.log(block.number, "block time");
    // targetBlockNumber -1 (will send tx 1 block before tx would actually be valid) -2 if you have a lot of latency
    if (targetBlockNumber - 1 <= block.number) {
      snipe();
    } else {
      console.log("not yet");
    }
  });
}

// Listens to contract variable and mints once they are valid for minting
async function stateContractListener() {
  wsProvider.on("block", async (block) => {
    let paused = await httpContract.paused();
    let onlyAllowList = await httpContract.onlyAllowList();
    console.log(paused);
    console.log(onlyAllowList);
    if (!paused && onlyAllowList) {
      snipe();
    }
  });
}

// listen to pending txs, if any, find one that corresponds to method and execute after it
async function pendingTxListener() {
  wsProvider.on("pending", async (tx) => {
    const txInfo = await httpProvider.getTransaction(tx);
    if (txInfo) {
      // specify here the transaction made and owner who will make the call
      if (
        txInfo.data.indexOf("0xee1cc944") !== -1 &&
        txInfo.from.toLowerCase() ==
        // set to owner / manager wallet that has initialized contract. Watch if ownership is transferred
          ownerWallet.toLowerCase()
      ) {
        console.log(txInfo);
        snipe();
      }
    }
  });
}

// listen to contract events and execute after it
async function eventListener() {
  wsContract.on("Unpaused", async (from) => {
    console.log(`${from} has unpaused the contract`);
    if (!test) {
      snipe();
    }
  });
}

// listen to contract Initialize event altering states and act accordingly
// pair this with blocktime listener
async function listenToInitializer() {
  wsContract.once(
    "Initialized",
    // passed parameters that initialize sales
    async (
      _allowlistStartTime,
      _publicSaleStartTime,
      _allowlistPrice,
      _salePrice
    ) => {

      allowlistStartTime = _allowlistStartTime;
      publicSaleStartTime = _publicSaleStartTime;
      allowlistPrice = _allowlistPrice;
      salePrice = _salePrice;

      console.log(
        _allowlistStartTime,
        _publicSaleStartTime,
        _allowlistPrice,
        _salePrice
      );
    const estimatedTime = allowlist ? allowlistStartTime : publicSaleStartTime - Date.now();
    setTimeout(snipe(), estimatedTime);
    }
  );
}

// generate signature proof
// parse wallet object, not wallet address
async function parseSignature(address) {
  // generate Leaf Nodes
  const leaftNodes = addr.map(address => ethers.utils.keccak256(address));
  // Generate a Tree
  const tree = new MerkleTree(leaftNodes, ethers.utils.keccak256, {sortPairs: true});

  const buf2hex = x => "0x" + x.toString("hex");

  const rootHash = tree.getHexRoot()
  console.log('rootHash', rootHash)

  const leaf = ethers.utils.keccak256(address)
  const proof = tree.getProof(leaf).map(x => buf2hex(x.data))
  return proof
}

async function fetchABI() {
  const response = await fetch(
    `https://api.${
      avalanche ? 'snowtrace' : 'etherscan'
    }.io/api?module=contract&action=getabi&address=${
      process.env.CONTRACT}&apikey=${process.env.ETHERSCAN_API_KEY}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(`unable to fetch abi`);
  }
  const data = await response.json();
  abi = data;
}

module.exports = {
  blockTimeListener: blockTimeListener,
  blockNumberListener: blockNumberListener,
  stateContractListener: stateContractListener,
  pendingTxListener: pendingTxListener,
  eventListener: eventListener,
  listenToInitializer: listenToInitializer,
}