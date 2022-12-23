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
const { ethers, providers } = require("ethers");
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

// Current ethereum block is 15202823 july 24 2022
// script sets target block according to contract
let targetBlockNumber = Number.POSITIVE_INFINITY;
// blocktime is expressed in unix / 1000 https://www.epochconverter.com/
// script sets target start time according to contract
let publicSaleStartTime = 0;
let allowlistStartTime = Number.POSITIVE_INFINITY;

// Price in ether. 1 ether = 10^18 wei
// script sets price according to contract
let allowlistPrice = ethers.utils.parseEther("0.0");
let salePrice = ethers.utils.parseEther("0.0"); // public sale price
let minGas = ethers.utils.parseEther("0.00");

const amount = 1; // amount to mint per tx

// If function depends on owner wallet to identify if certain tx
// has been called (pendingTxListener.js requires a set ownerWallet)
const ownerWallet = "0x";

/**
 * @notify - You must be aware of these options and set them manually
 * @param maxFeePerGas Max fee per gas is refunded if not utilized
 * @param maxPriorityFeePerGas Max priority fee per gas is paid to miners
 * @param haltTime Time to halt in miliseconds (1000 = 1 second)
 */
let maxFeePerGas = ethers.utils.parseUnits("300", "gwei");
let maxPriorityFeePerGas = ethers.utils.parseUnits("50", "gwei");
const gasLimit = 300000;
const haltTime = 1300;

/**
 * @param test        set to false if using hardhat
 * @param avalanche   0 false, 1 true, 2 hardhat
 * @param spamMint    times you would like the bot to attempt to mint prior to on time mint
 * @param abiFetch    if you want to fetch ABI (requires API KEY from blockscan)
 * @param wsOnly      calling write transactions to WebSocket (disallowed by Avalanche RPC)
 * @param allowlist   if minting to allowlist
 * @param requiresSignature if minting requires signature
 * @param snowSightPK Snowsight private key
 * @param snowSight   Tx Propagator service provider. Requires Premium plan. wsOnly recommended.
 */
const test = false;
const avalanche = 1;
const spamMint = 1;
const abiFetch = false;
const wsOnly = true;
const allowlist = false;
const requiresSignature = false;
const snowsightPK = process.env.PRIVATE_KEY1;
const snowsight = false;

const utilizedPrivateKeys = [
                            process.env.PRIVATE_KEY1, 
                            process.env.PRIVATE_KEY2, 
                            process.env.PRIVATE_KEY3,
                            process.env.PRIVATE_KEY4,
                            process.env.D1,
                            process.env.D2,
                            process.env.D3,
                            process.env.D4,
                            process.env.SA3,
                            process.env.SA5,
                            process.env.SA6,
                            process.env.SA7,
                            process.env.SA8,
                            process.env.SA9,
                            process.env.SA12,
                            process.env.SA14,
                            process.env.SA20,
                            process.env.SA25,
                            process.env.SA31,
                            process.env.SA35,
                            process.env.SA36,
                            process.env.SA52,
                            process.env.SA54,
                            process.env.SA59,
                            process.env.SA60,
                            process.env.SA62,
                            process.env.SA65,
                            process.env.SA84,
                            process.env.SA91,
]

// ██            ██    ▄    ██          ▀██   ██                    ▄    ██
// ▄▄▄  ▄▄ ▄▄▄   ▄▄▄  ▄██▄  ▄▄▄   ▄▄▄▄    ██  ▄▄▄  ▄▄▄▄▄▄   ▄▄▄▄   ▄██▄  ▄▄▄    ▄▄▄   ▄▄ ▄▄▄
//  ██   ██  ██   ██   ██    ██  ▀▀ ▄██   ██   ██  ▀  ▄█▀  ▀▀ ▄██   ██    ██  ▄█  ▀█▄  ██  ██
//  ██   ██  ██   ██   ██    ██  ▄█▀ ██   ██   ██   ▄█▀    ▄█▀ ██   ██    ██  ██   ██  ██  ██
// ▄██▄ ▄██▄ ██▄ ▄██▄  ▀█▄▀ ▄██▄ ▀█▄▄▀█▀ ▄██▄ ▄██▄ ██▄▄▄▄█ ▀█▄▄▀█▀  ▀█▄▀ ▄██▄  ▀█▄▄█▀ ▄██▄ ██▄ ↓

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

// intialize snowsight webSocket
snowsight ? snowSightMessage(snowsightPK) : console.log("snowsight not enabled");

// Initialize contract instances
const wsContract = new ethers.Contract(process.env.CONTRACT, abi, wsProvider);
const httpContract = new ethers.Contract(
  avalanche == 2 ? process.env.HH_CONTRACT : process.env.CONTRACT,
  abi,
  httpProvider
);

/**
 * @notify Add and remove private keys from this array
 *         according to how many you want to mint with
 */
let wallets = [];
instantiateWallets(utilizedPrivateKeys);

//   ▄▀█▄                             ▄    ██
// ▄██▄   ▄▄▄ ▄▄▄  ▄▄ ▄▄▄     ▄▄▄▄  ▄██▄  ▄▄▄    ▄▄▄   ▄▄ ▄▄▄    ▄▄▄▄
//  ██     ██  ██   ██  ██  ▄█   ▀▀  ██    ██  ▄█  ▀█▄  ██  ██  ██▄ ▀
//  ██     ██  ██   ██  ██  ██       ██    ██  ██   ██  ██  ██  ▄ ▀█▄▄
// ▄██▄    ▀█▄▄▀█▄ ▄██▄ ██▄  ▀█▄▄▄▀  ▀█▄▀ ▄██▄  ▀█▄▄█▀ ▄██▄ ██▄ █▀▄▄█▀  ↓

/**
 * @param privateKey Private key used to pay for SnowSight premium plan
 */
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

/**
 * @param privateKeys Private keys to be used to mint
 */
async function instantiateWallets(privateKeys) {
  try {
    allowlist ? 
    allowlistPrice = (await httpContract.allowlistPrice()).mul(amount) :
    salePrice = (await httpContract.salePrice()).mul(amount);
  } catch (e) {
    console.log(e);
  }
  const promises = privateKeys.map(async (privateKey) => {
    let wallet;
    try {
      wallet = await initiateWallet(privateKey);
      balance = await httpProvider.getBalance(wallet[0].address);

      let minBalance = (allowlist ? allowlistPrice : salePrice).add(minGas);
      greater = balance.gt(minBalance);
    } catch (error) {
      console.log(error);
    }
    if (greater){
      console.log('✔️ ', wallet[0].address);
      wallets.push(wallet);
    }
  });
  await Promise.all(promises);
}

/**
 * @notify Constructs signer, initiating a wallet instance and getting its nonce
 *         for quick access to nonce instead of having it retrieved during call
 * @param privateKey Private key to be used to mint
 */
async function initiateWallet(privateKey) {
  let signer = [null, null];
  signer[0] = new ethers.Wallet(privateKey, httpProvider);
  signer[1] = await signer[0].getTransactionCount();
  return signer;
}

/**
 * @notify Actionable mint
 */
async function raid() {
  console.log("minting");
  let contract = wsOnly ? wsContract : httpContract;
  if (!test) {
    let mints = wallets.map(async (wallet) => {
      mint(contract, wallet);
      console.log(wallet);
    });
    await Promise.all(mints);
    console.log("mint ran successfully!");
  } else {
    // mock mint
    let mints = wallets.map(async (wallet) => {
      const [signer, nonce] = wallet;
      console.log("signer", signer);
      console.log("nonce", nonce);
    });
    await Promise.all(mints);
    console.log("mock mint ran successfully!");
  }
}

/**
 * @notify Mint function, constructs the mint call
 */
 async function mint(contract, wallet) {
  let [signer, nonce] = wallet;
  
  for (i = 0; i <= spamMint + 1; i++){
  let options = {
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
    value: allowlist ? allowlistPrice : salePrice,
    gasLimit: gasLimit,
    nonce: nonce,
  };
    // increment nonce for next mint
  nonce++;
  // if it requires parsing a signature, make sure to include it as a param
  if (requiresSignature) {
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
  console.log("halting");
  await halt(haltTime);
  }
}

/**
 * @notify Contract has already been initialized.
 *         Retrieves all required contract data to mint on time.
 */
async function presetTime() {
  try {
    allowlist ?
    allowlistStartTime = (await httpContract.allowlistStartTime()).toNumber() :
    publicSaleStartTime = (await httpContract.publicSaleStartTime()).toNumber();
  } catch (e) {
    console.log('e', e);
  }

  const timestamp = await blockEstimatedTime(allowlist ? allowlistStartTime : publicSaleStartTime);
  const timeToMintInMS = timestamp - ((spamMint + 2) * haltTime);
  // const timeToMintInMS = timestamp;
  console.log("now:", Date.now() / 1000);
  console.log("will mint in", timeToMintInMS / 1000, "seconds");
  console.log("timestamp to mint: ", (timeToMintInMS + Date.now()) / 1000)
  console.log("price:", (allowlist ? allowlistPrice : salePrice) / 1e18, "avax");
  setTimeout(function () {
    raid();
  }, timeToMintInMS);
}

/**
 * @notify Listens to block time and mints once current time is above targetBlockTime
 */
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
      raid();
    } else {
      console.log("not yet");
    }
  });
}

/**
 * @notify Listen to blocks number and calls mint once current block is one less then targetBlockNumber
 */
async function blockNumberListener() {
  wsProvider.on("block", (block) => {
    console.log(block.number, "block time");
    // targetBlockNumber -1 (will send tx 1 block before tx would actually be valid)
    // -2 if you have a lot of latency
    if (targetBlockNumber - 1 <= block.number) {
      raid();
    } else {
      console.log("not yet");
    }
  });
}

/**
 * @notify Listens to contract variable and mints once they are valid for minting
 */
async function stateContractListener() {
  wsProvider.on("block", async (block) => {
    let paused = await httpContract.paused();
    let onlyAllowList = await httpContract.onlyAllowList();
    console.log(paused);
    console.log(onlyAllowList);
    if (!paused && onlyAllowList) {
      raid();
    }
  });
}

/**
 * @notify listen to pending txs, if any, find one that corresponds to method and execute after it
 */
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
        raid();
      }
    }
  });
}

/**
 * @notify Listen to contract events and execute after it
 */
async function eventListener() {
  wsContract.on("Unpaused", async (from) => {
    console.log(`${from} has unpaused the contract`);
    if (!test) {
      raid();
    }
  });
}

/**
 * @notify Listen to contract Initialize event altering states and act mint on time
 */
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
    
      const timestamp = await blockEstimatedTime(allowlist ? allowlistStartTime : publicSaleStartTime);
      console.log("timestamp", timestamp);

      setTimeout(raid(), timestamp);
    }
  );
}

/**
 * @notify Helper function to halt code execution
 */
const halt = (ms) => new Promise((r) => setTimeout(r, ms));

async function blockEstimatedTime(time) {
  let timestamp =
        (await wsProvider.getBlock(await wsProvider.getBlockNumber())).timestamp * 1000;
  timestamp = (time * 1000) - (timestamp);
  return timestamp;
}

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
