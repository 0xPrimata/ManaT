const initializer = require('./app.js').initializer;

console.log('--------------------------------')
console.log('Initializer');
console.log('--------------------------------')
console.log('make sure to change contract and abi before hand');
console.log('make sure the event you are listening to is the corerct one');
console.log('configure gas in gwei (same as metamask)');


initializer()

module.exports = initializer;