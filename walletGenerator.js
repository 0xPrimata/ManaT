const ethers = require('ethers');  
const crypto = require('crypto');
const fs = require('fs');

const walletAmount = 20;

let wallets = []

for (let i = 0; i < walletAmount; i++) {
    const id = crypto.randomBytes(32).toString('hex');
    const privateKey = "0x"+id;
    const wallet = new ethers.Wallet(privateKey);
    const publicKey = wallet.address;
    let w = {
        privateKey: privateKey,
        publicKey: publicKey
    }
    wallets[i] = w;
}

const data = JSON.stringify(wallets);

console.log(data);

fs.writeFile('.env.json', data, 'utf8', function(){console.log('done')});