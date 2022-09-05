const ethers = require('ethers');  
const wallets = require("./.env.json");
require("dotenv").config()

const senderWalletPrivateKey = process.env.PRIVATE_KEY;

// make sure you consider gas
const amountToTransfer = ethers.utils.formatUnits(ethers.BigNumber.from('1000000000000000000'), 'wei')

const mainnet = false;

const provider = new ethers.providers.JsonRpcProvider(mainnet ? process.env.HTTP : process.env.HTTP_TEST);

const signer = new ethers.Wallet(senderWalletPrivateKey, provider);
let n;
signer.getTransactionCount().then(nonce => {
    n = nonce;
    console.log(n);
    for (let i = 0; wallets.length > i; i++){
        const tx = {
            to: wallets[i].publicKey,
            value: amountToTransfer,
            gasLimit: 250000,
            gasPrice: ethers.utils.parseUnits("30", "gwei"),
            nonce: n + i
        }
        try {
            signer.sendTransaction(tx).then((transaction) => {
                console.log(transaction);
            })
        } catch (error) {
            console.log(error)
        }
        
    }
})