const pendingTxListener = require('./app.js').pendingTxListener;

console.log('--------------------------------')
console.log('initialize pendingTxListener');
console.log('--------------------------------')
console.log('make sure to change contract and abi before hand');
console.log('--------------------------------')
console.log('!!!!make sure to change transaction hexadecimal ID and contract owner!!!')
console.log('--------------------------------')
console.log('configure gas in gwei (same as metamask)');


pendingTxListener()
