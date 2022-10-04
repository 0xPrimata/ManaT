# Project ManaT

## NFT Minting Bot

## Requirements:
 * **NodeJS**
 * **Ethers.js**
 * **merkletreejs** if it requires a signature. You will also need to scrape or know the wallets in advance. (ADVANCED)
 * WS aka **WebSocket RPC**. It creates a permanent connection with the provider and quickly receives data from a Node.
 * **HTTPS RPC** aka Hypertext Transfer Protocol aka standard send and receive data protocol. Some providers do NOT support using WebSocket to make requests to the blockchain. If you stumble upon a provider that does accept using WS for making requests, HTTPS won't be necessary but files require some modifications.
 * **node-fetch@1.7.3** if fetching ABI.
 * **dotenv** to properly handle all env keys.

## Objetives

When trying to be the first in anything in a blockchain, you want to add your transaction to the <abbr title="a mempool is a waiting area for the transactions that haven't been added to a block and are still unconfirmed. This is how a Blockchain node deals with transactions that have not yet been included in a block.">mempool</abbr> as quickly as possible and be a priority among other available transactions. You want to relay your message as **fast** as possible, to as **many nodes** as possible, at the **right moment**, and the largest gas price. Considering limited gas resources, you have a few options:

### Picking an RPC Provider
You will need to chose an RPC provider to send messages to the blockchain. Infura is a pretty good option. Private and paid node providers are usually better since there are no request congestion, consistent connection, etc.

> Here is a list of some of RPC node providers: https://github.com/arddluma/awesome-list-rpc-nodes-providers

Running the bot from a server is one of your best options. It severely decreases the amount it takes to send and receive messages from servers because, well, most RPCs are in servers. Running from home severely increases the time it takes to add your transaction to mempool. AWS east coast 1 is recommended because it's the closest to most nodes. Digital Ocean also provides a pretty good server. https://m.do.co/c/806febca78e6

[Snowsight](https://docs.snowsight.chainsight.dev/) might be one of your best bets to relay your request. It provides two premium services, mempool stream and transaction propagator. You, as a front runner, are interested in the later, which relays through Snowsight's validator node network your transaction request, quickly letting as many nodes know about your request, effectively prioritizing your request.

Just like Snowsight, you can also relay a message to many RPC Providers and get your message out there quickly, but that's usually a burden on server hardware. Be aware if utilizing multiple HTTP RPCs to propagate your transaction.


## Setup
1. Copy .envexample and rename it to .env.
2. Each wallet has its own private key and should be written to .env.
3. Fund wallets with enough for mint plus gas!
4. Adjust gas to your target priority. 1500
3. ABI fetching is supported but **not recommended**. Go to snowtrace.io/address/{**contract**}#code, scroll all the way to the bottom, and copy the Contract ABI. Remove everything that was previously in abi.json and paste in the new abi.
4. Get an RPC and paste it in .env to `HTTP=` and `WS=` if WebSockets are required for your minting method.
5. Get the contract and paste it in .env to `CONTRACT=`
6. Run: `npm install node-fetch@1.7.3 ethers merkletreejs dotenv --save`
9. Read the contract
10. Find the mint function and change all wallets in app.js to also call the function in the contract.
11. Check out how many inputs the function has. Use those to the calls in app.js in the correct order and correct types (strings must be in quotes, numbers and byte should not have quotes, byte should include).
12. Choose a minting method. Some directions on chosing it:
       * Search for events that will be called when mint opens. If so, use "eventListener.js". **Specify the current event it listens for.**
       * Look for time variables. If present, use "presetTime.js" or "blockTimeListener.js" your latency and assurance. **Set the blockTime you want the bot to mint at.**
       * Is mint dependent on block number? If so, use "blockNumberListener.js". **Input the blockNumber you want the bot to mint at.**
       * Look for a function that the owner only is allowed to call and will initialize the minting. If so, use "pendingTxListener.js". **Input it as the listened function.**
       * Look for a public variable that says if minting is open/closed paused/unpaused. If so, use "stateContractListener.js". **Specify the variable you are reading on every block.**
       * If the contract is initialized with parameters and you are too lazy to input those and need to go, use "listenToInitializer.js". **Has to be paired   manually with other functions (ADVANCED)**
13. Choose if you are running it as a test or not (`true` or `false`)
14. Choose if you are running it on Avalanche or Ethereum (`1` or `0`)
15. `targetBlockTime` is set automatically if there is targetBlockTime variable on the contract. Feel free to modify if necessary;
16. `publicStartTime` is set automatically if there is publicStartTime variable on the contract. Feel free to modify if necessary;
16. `allowlistStartTime` is set automatically if there is allowlistStartTime variable on the contract. Feel free to modify if necessary;
17. `allowlistPrice` is set automatically if there is allowlistPrice variable on the contract. Feel free to modify if necessary;
18. `salePrice` is set automatically if there is salePrice variable on the contract. Feel free to modify if necessary;

##. Methods
Run your chosen method according to your strategy by running on a terminal on the root folder:
       
        node presetTime.js
        node blockTimeListener.js
        node eventListener.js
        node pendingTxListener.js
        node stateContractListener.js
        node listenToInitializer.js


# EXTRA
If you've found a contract that does not require any listening and just want to mint a good amount of it out of a bunch of wallets, run these in sequence and make sure they do everything properly:

       node walletGenerator.js
       node walletSplitter.js
       node massMint.js
       node recouple.js

walletGenerator generates a .env.json that stores a bunch of privateKeys with their corresponding publicKeys.
walletSpplitter splits money from a main wallet specified in .env and send specified amount of money to them.
massMint does the deed.
recouple regroups money to the original wallet.

**Once transactions are made, bot will stop by itself.**
To enable sequential minting by the same wallet, comment `process.exit(0)` at the bottom of `snipe()` function

# #Pillage&Plunder Avalanche shall grow with other's liquidity

**Refrain from using this bot in Avalanche.**

**Make sure that the function you will use is properly set up.**

**Anything included in this repository may not be shared, distributed, modified, gifted or sold without the owner's consent.**

## Hardhat Test

This project has a test kit to showcase how it 

npm install  @openzeppelin/contracts @chainlink/contracts @openzeppelin/contracts-upgradeable 

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
