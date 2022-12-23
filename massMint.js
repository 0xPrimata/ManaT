const ethers = require('ethers');  
const wallets = require("./.env.json");
const abi = require('./abi.json');



// make sure you consider gas
const amountToTransfer = ethers.utils.formatUnits('0', 'gwei');

// tokens to mint
const amount = 1;
const options = {
    value: amountToTransfer
}
const mainnet = false;

const provider = ethers.getDefaultProvider(mainnet ? 'homestead' : 'rinkeby');

const contractAddress = '0x5fbf285083104bbe208e11EEd8860E384f248DFE';
const contract = new ethers.Contract(contractAddress, abi, provider);

for (let i = 0; wallets.length > i; i++){

    const minter = new ethers.Wallet(wallets[i].privateKey, provider);

    // name the mint method correctly. Mint function name might change
    contract.connect(minter).publicSaleMint(amount, options)
}