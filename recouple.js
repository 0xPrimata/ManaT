const ethers = require('ethers');  
const wallets = require("./.env.json");
require("dotenv").config()

const avalanche = false;

const provider = new ethers.providers.JsonRpcProvider(avalanche ? process.env.HTTP : process.env.HTTP_ETH);

transactions = [];

for (let i = 0; wallets.length > i; i++){
    provider.getBalance(wallets[i].publicKey).then(balance => {
        console.log('balance', balance);
        provider.getFeeData().then(data => {
            console.log(data);
            let toSend, tx;
            try {
                toSend = balance.sub(data.maxFeePerGas.mul(21000));
                console.log(toSend);
            } catch (error) {
                console.log('calculate', error)
            }
            try {
             tx = {
                to: process.env.PUBLIC_KEY,
                value: toSend,
                gasPrice: data.maxFeePerGas,
                gasLimit: 21000,
            }
            } catch (error) {
                console.log('tx', error)
            }
            

            const sender = new ethers.Wallet(wallets[i].privateKey, provider);
            try {
                sender.sendTransaction(tx).then((transaction) => {
                    console.log(transaction);
            })
            } catch (e) {
                console.log('final',e)
            }
            
        })
    })
}