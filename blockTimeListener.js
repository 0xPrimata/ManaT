const blockTimeListener = require('./app.js').blockTimeListener;

console.log('--------------------------------')
console.log('initialize blockTimeListener');
console.log('--------------------------------')
console.log('make sure to change contract and abi before hand');
console.log('check if the time is correct. add seconds to frontrun');
console.log('configure gas in gwei (same as metamask)');


blockTimeListener()
