const {STARTING_BALANCE} = require('../config');
const {ec, cryptoHash} = require('../util');
const Transaction = require('./transaction');

class Wallet {

    constructor() {
        this.balance = STARTING_BALANCE;
        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        return this.keyPair.sign(cryptoHash(data));
    }

    createTransaction({amount, recipient, chain}) {
        if (chain) {
            this.balance = Wallet.calculateBalance({chain, address: this.publicKey});
        }
        if (amount > this.balance) {
            throw Error('Amount exceeds balance')
        }

        return new Transaction({senderWallet: this, recipient, amount});
    }

    static calculateBalance({chain, address}) {
        let outputTotal = 0;
        let hasConductedTransaction = false;

        chain.reverse().some((block, index) => {
            if (block.data.data) {
                block.data.data.forEach((t) => {
                    if (address === t.input.address) {
                        hasConductedTransaction = true;
                    }
                    outputTotal += t.outputMap[address] ? t.outputMap[address] : 0;
                });
            }
            return hasConductedTransaction;
        });

        return hasConductedTransaction ? outputTotal : STARTING_BALANCE + outputTotal;
    }
}

module.exports = Wallet;
