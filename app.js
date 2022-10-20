//  _______                                                 __          __       __                            ________
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
const abi = require("./abi.json");
const parseSignature = require("./utils/parseSignature.js");
const fetchABI = require("./utils/fetchABI.js");
const WebSocket = require("ws");
const { checkResultErrors } = require("ethers/lib/utils");

//                    ▄    ██
//   ▄▄▄   ▄▄▄ ▄▄▄  ▄██▄  ▄▄▄    ▄▄▄   ▄▄ ▄▄▄    ▄▄▄▄
// ▄█  ▀█▄  ██▀  ██  ██    ██  ▄█  ▀█▄  ██  ██  ██▄ ▀
// ██   ██  ██    █  ██    ██  ██   ██  ██  ██  ▄ ▀█▄▄
//  ▀█▄▄█▀  ██▄▄▄▀   ▀█▄▀ ▄██▄  ▀█▄▄█▀ ▄██▄ ██▄ █▀▄▄█▀  ↓
//          ██
//         ▀▀▀▀

// block produced. Current ethereum block is 15202823 july 24 2022
let targetBlockNumber = 20000000;
// blocktime is expressed in unix / 1000 https://www.epochconverter.com/
// initiate with Number.POSITIVE_INFINITY if listening to initializer
let publicSaleStartTime = Number.POSITIVE_INFINITY;
let allowlistStartTime = Number.POSITIVE_INFINITY;

let allowlistPrice = ethers.utils.parseEther("0.0"); // allowlist sale price
let salePrice = ethers.utils.parseEther("0.0"); // public sale price

const amount = 1; // amount per tx

// If function depends on owner wallet to identify if certain tx
// has been called (pendingTxListener.js)
const ownerWallet = "0x";

// These options must be set manually
const maxFeePerGas = ethers.utils.parseUnits("1500", "gwei");
const maxPriorityFeePerGas = ethers.utils.parseUnits("1000", "gwei");
const gasLimit = 300000;

const test = false; //set to false if using hardhat
const avalanche = 1; // 0 false, 1 true, 2 hardhat, 3 snowsight
const spamMint = 0; // times you would like the bot to mint prior to time
const abiFetch = false; // if you want to fetch ABI (requires API KEY from blockscan)
const wsOnly = true; // calling write transactions to WebSocket (disallowed by Avalanche RPC)
const allowlist = false; // if minting to allowlist
const requiresSignature = false;
const snowsightPK = process.env.PRIVATE_KEY1; // wallet use to pay for snowsight usage
const snowsight = false; // if you are going to use snowsight as tx propagator. This is a paid private node. wsOnly recommended

// Initialize providers
const wsProvider = new ethers.providers.WebSocketProvider(
  snowsight
    ? process.env.WS_SNOWSIGHT
    : avalanche == 2
    ? process.env.WS_HH
    : avalanche
    ? process.env.WS
    : process.env.WS_ETH
);
const httpProvider = new ethers.providers.JsonRpcProvider(
  avalanche == 2 ? process.env.HTTP_HH : avalanche ? process.env.HTTP : process.env.HTTP_ETH
);

// intialize abi
abiFetch ? fetchABI(avalanche) : console.log("abi has been manually set");

// initialzie snowsight webSocket
snowsight ? snowSightMessage(snowsightPK) : console.log("snowsight not enabled");

// Initialize contract instances
const wsContract = new ethers.Contract(process.env.CONTRACT, abi, wsProvider);
const httpContract = new ethers.Contract(
  avalanche == 2 ? process.env.HH_CONTRACT : process.env.CONTRACT,
  abi,
  httpProvider
);

// Instantiate wallets. Parse in all private keys you want to use
let wallets = [];
instantiateWallets([
  process.env.PRIVATE_KEY1,
  process.env.PRIVATE_KEY2,
  process.env.PRIVATE_KEY3,
  // process.env.PRIVATE_KEY4,
  // process.env.SA12,
  // process.env.SA20,
  // process.env.SA54,
  // process.env.SA59,
  // process.env.SA65
]);

//   ▄▀█▄                             ▄    ██
// ▄██▄   ▄▄▄ ▄▄▄  ▄▄ ▄▄▄     ▄▄▄▄  ▄██▄  ▄▄▄    ▄▄▄   ▄▄ ▄▄▄    ▄▄▄▄
//  ██     ██  ██   ██  ██  ▄█   ▀▀  ██    ██  ▄█  ▀█▄  ██  ██  ██▄ ▀
//  ██     ██  ██   ██  ██  ██       ██    ██  ██   ██  ██  ██  ▄ ▀█▄▄
// ▄██▄    ▀█▄▄▀█▄ ▄██▄ ██▄  ▀█▄▄▄▀  ▀█▄▀ ▄██▄  ▀█▄▄█▀ ▄██▄ ██▄ █▀▄▄█▀  ↓

async function snowSightMessage(privateKey) {
  let snowWallet = new ethers.Wallet(privateKey, httpProvider);

  const key = "Sign this message to authenticate your wallet with Snowsight.";
  const signed_key = await snowWallet.signMessage(key);

  let message = JSON.stringify({ signed_key: signed_key });

  wsProvider.on("open", function open() {
    wsProvider.send(message);
  });

  wsProvider.on("message", function message(data) {
    console.log("received:", data);
  });

  wsProvider.on("error", function message(data) {
    console.log("error:", data);
  });
}

async function instantiateWallets(privateKeys) {
  const promises = privateKeys.map(async (privateKey) => {
    let wallet;
    try {
      wallet = await initiateWallet(privateKey);
    } catch (error) {
      console.log(error);
    }
    wallets.push(wallet);
  });
  await Promise.all(promises);
}

// Constructs signer, initiating a wallet instance and getting its nonce
// for quick access to nonce instead of having it retrieved during call
async function initiateWallet(privateKey) {
  let signer = [null, null];
  signer[0] = new ethers.Wallet(privateKey, wsOnly ? wsProvider : httpProvider);
  signer[1] = await signer[0].getTransactionCount();
  console.log("signer:", signer[0].address);
  console.log("nonce:", signer[1]);
  return signer;
}

// Actionable mint function
async function snipe() {
  console.log("minting");
  let contract = wsOnly ? wsContract : httpContract;
  if (!test) {
    let mints = wallets.map(async (wallet) => {
      mint(contract, wallet);
    });
    for (let i = 0; i < spamMint; i++) {
      await Promise.all(mints);
      wait(1);
    }
    await Promise.all(mints);
    console.log("mint ran successfully!");
  } else {
    // mock mint
    let mints = wallets.map(async (wallet) => {
      const [signer, nonce] = wallet;
      console.log("signer", signer);
      console.log("nonce", nonce);
    });
    if (spamMint > 0) {
      for (let i = 0; i < spamMint; i++) {
        await Promise.all(mints);
        wait(1000);
      }
    }
    await Promise.all(mints);
    console.log("mock mint ran successfully!");
  }
}
// Mint function, constructs the mint call
async function mint(contract, wallet) {
  const [signer, nonce] = wallet;
  let options = {
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
    value: allowlist ? allowlistPrice : salePrice,
    gasLimit: gasLimit,
    nonce: nonce,
  };

  // increment nonce for next mint
  wallet[1]++;
  // if it requires parsing a signature, make sure to include it as a param
  if (requiresSignature) {
    cosnole.log("mint");
    try {
      allowlist
        ? contract.connect(signer).allowlistMint(amount, parseSignature(signer.address), options)
        : contract.connect(signer).publicSaleMint(amount, parseSignature(signer.address), options);
    } catch (e) {
      console.log(e);
    }
  } else {
    try {
      allowlist
        ? contract.connect(signer).allowlistMint(amount, options)
        : contract.connect(signer).publicSaleMint(amount, options);
    } catch (e) {
      console.log(e);
    }
  }
}

async function presetTime() {
  allowlistStartTime = (await httpContract.allowlistStartTime()).toNumber();
  publicSaleStartTime = (await httpContract.publicSaleStartTime()).toNumber();
  allowlistPrice = (await httpContract.allowlistPrice()).mul(amount);
  salePrice = (await httpContract.salePrice()).mul(amount);
  const now = Date.now();
  const timestamp =
    (await wsProvider.getBlock((await wsProvider.getBlockNumber()+1))).timestamp * 1000;
  console.log("timestamp:", timestamp);
  let difference = (now - timestamp);
  console.log('difference', difference);

  const estimatedTime =
    (allowlist ? allowlistStartTime : publicSaleStartTime) * 1000 - (Date.now());
  const blockEstimatedTime =
    (allowlist ? allowlistStartTime : publicSaleStartTime) * 1000 - (timestamp - 1000);
  console.log('blockEstimatedTime:', blockEstimatedTime);
  console.log("allowlist price:", allowlistPrice);
  console.log('estimatedTime - blockEstimatedTime', estimatedTime - blockEstimatedTime);
  console.log("sale price:", salePrice);
  console.log("estimated time:", estimatedTime);
  console.log("allowlist time:", allowlistStartTime);
  console.log("public sale time:", publicSaleStartTime);
  console.log("now:", Date.now() / 1000);
  setTimeout(function () {
    snipe();
  }, estimatedTime - (spamMint * 1000));
}

// Listens to block time and mints once current time is above targetBlockTime
async function blockTimeListener() {
  wsProvider.on("block", function (block) {
    let time = Date.now();
    allowlist
      ? console.log(allowlistStartTime, "allowlist")
      : console.log(publicSaleStartTime, "publicSale");
    console.log(time / 1000, "current time");

    // targetBlockTIme - 1 (will send tx 1 second before tx is actually good) if you have a lot of latency
    targetBlockTime = allowlist ? allowlistStartTime : publicSaleStartTime;
    if (targetBlockTime <= time / 1000) {
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
    // targetBlockNumber -1 (will send tx 1 block before tx would actually be valid)
    // -2 if you have a lot of latency
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
async function initializer() {
  wsContract.once(
    "Initialized",
    // passed parameters that initialize sales
    async (_allowlistStartTime, _publicSaleStartTime, _allowlistPrice, _salePrice) => {
      console.log("Initialized");
      allowlistStartTime = _allowlistStartTime.toNumber();
      publicSaleStartTime = _publicSaleStartTime.toNumber();
      allowlistPrice = _allowlistPrice.mul(amount);
      salePrice = _salePrice.mul(amount);

      console.log(_allowlistStartTime, _publicSaleStartTime, _allowlistPrice, _salePrice);
      const timestamp =
        (await wsProvider.getBlock(await wsProvider.getBlockNumber())).timestamp * 1000;
      console.log(timestamp);
      console.log(Date.now());
      const blockEstimatedTime =
        (allowlist ? allowlistStartTime : publicSaleStartTime) * 1000 - (timestamp-200);
      setTimeout(snipe(), blockEstimatedTime);
    }
  );
}

const wait = ms => new Promise(r => setTimeout(r, ms));

//                                            ▄
//   ▄▄▄▄  ▄▄▄ ▄▄▄ ▄▄▄ ▄▄▄    ▄▄▄   ▄▄▄ ▄▄  ▄██▄
// ▄█▄▄▄██  ▀█▄▄▀   ██▀  ██ ▄█  ▀█▄  ██▀ ▀▀  ██
// ██        ▄█▄    ██    █ ██   ██  ██      ██
//  ▀█▄▄▄▀ ▄█  ██▄  ██▄▄▄▀   ▀█▄▄█▀ ▄██▄     ▀█▄▀ ↓
//                  ██
//                 ▀▀▀▀

module.exports = {
  presetTime: presetTime,
  blockTimeListener: blockTimeListener,
  blockNumberListener: blockNumberListener,
  stateContractListener: stateContractListener,
  pendingTxListener: pendingTxListener,
  eventListener: eventListener,
  initializer: initializer,
};
