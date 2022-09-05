# Project ManaT

## NFT Minting bot

### Requirements:
 * NodeJS
 * Ethers.js
 * merkletreejs if it requires a signature. You will also need to scrape or know the wallets in advance. (ADVANCED)
 * WS aka WebSocket. It creates a permanent connection with the provider and quickly receives data from a Node.
 * Highly probable: HTTPS aka Hypertext Transfer Protocol aka standard send and receive data protocol. Some providers do NOT support using WebSocket to make requests to the blockchain. If you stumble upon a provider that does accept using WS for making requests, it won't be necessary.

Infura is pretty good but private and paid node providers are better. https://github.com/arddluma/awesome-list-rpc-nodes-providers

Running from a server is your best option. AWS east coast 1 is recommended because it's the closest to most nodes. Digital Ocean also provides a pretty good server. https://m.do.co/c/806febca78e6

Pro tip: [Snowsight](https://docs.snowsight.chainsight.dev/) might be one of your best bets to front run anyone. It requires some extra doing but it is supported.

Each wallet has its own private key and should be written to .env. Fund them with enough gas!
ABI fetching is supported but not recommended. Go to snowtrace.io/address/{**contract**}#code, scroll all the way to the bottom, and copy the Contract ABI. Paste it in abi.json.

### Steps:
 * run: `npm install node-fetch@1.7.3 ethers merkletreejs --save`
 * Get the Contract Address and paste it to .env CONTRACT variable
 * Get the ABI and paste it to abi.json (content of the file should be the ABI itself. the ABI consists of a json object inside a pair of squared bracket `[]`. See the template abi provided)
 * Read the contract:
   * Find the mint function and change all wallets in app.js to also call the function in the contract.
   * Check out how many inputs the function has. Use those to the calls in app.js in the correct order and correct types (strings must be in quotes as an example)
   * Check out how the contract starts the mint.
          * Search for events that will be called when mint opens. If so, use "eventListener.js". **Specify the current event it listens for.**
          * Look for time variables. If so, use "blockTimeListener.js". **Input the blockTime you want the bot to mint at.**
          * Is mint dependent on block number? If so, use "blockNumberListener.js". **Input the blockNumber you want the bot to mint at.**
          * Look for a function that the owner only is allowed to call and will initialize the minting. If so, use "pendingTxListener.js". **Input it as the listened function.**
          * Look for a public variable that says if minting is open/closed paused/unpaused. If so, use "stateContractListener.js". **Specify the variable you are reading on every block.**
          * If the contract is initialized with parameters and you are too lazy to input those and need to go, use "listenToInitializer.js". **Has to be paired   manually with other functions (ADVANCED)**
 * Choose if you are running it as a test or not (`true` or `false`)
 * Choose if you are running it on Avalanche or Ethereum (`true` or `false`)
 * targetBlockTime = Number.POSITIVE_INFINITY;
 * allowlistStartTime = Number.POSITIVE_INFINITY;
 * allowlistPrice = ethers.utils.parseUnits("0", "gwei");
 * salePrice = ethers.utils.parseUnits("0", "gwei");

 * Run one of the methods to mint according to your chosen strategy:

        node blockTimeListener.js
        node eventListener.js
        node pendingTxListener.js
        node stateContractListener.js
        node listenToInitializer.js


**Once transactions are made, bot will stop by itself.**
To enable sequential minting by the same wallet, comment `process.exit(0)` at the bottom of `snipe()` function

**Make sure that the function you will use is properly set up.**

Anything included in this repository may not be shared, distributed, modified, gifted or sold without the owner's consent.