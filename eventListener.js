const eventListener = require('./app.js').eventListener;

console.log('--------------------------------')
console.log('initialize eventListener');
console.log('--------------------------------')
console.log('make sure to change contract and abi before hand');
console.log('make sure the event you are listening to is the corerct one');
console.log('configure gas in gwei (same as metamask)');


eventListener()
