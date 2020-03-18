const uuid = require('uuid');
const {verifySignature} = require('../util');
const {REWARD_INPUT, MINING_REWARD} = require('../config');

class Transaction {

    constructor({senderWallet, recipient, amount}) {
        this.id = uuid.v1();
        this.outputMap = this.createOutputMap({senderWallet, recipient, amount});
        this.input = this.createInput({senderWallet, outputMap: this.outputMap});
    }

    createInput({senderWallet, outputMap}) {
        return {
            timestamp: new Date(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        }
    }

    createOutputMap({senderWallet, recipient, amount}) {
        let outputMap = {};

        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

        return outputMap;
    }

    static rewardTransaction({minerWallet}) {
        let outputMap = {};
        outputMap[minerWallet.publicKey] = MINING_REWARD;
        return {
            id: uuid.v1(), input: REWARD_INPUT, outputMap
        }
    }

    static validTransaction(transaction) {
        const {input: {address, amount, signature}, outputMap} = transaction;
        const outputTotal = Object.values(outputMap)
            .reduce((total, outputAmount) => total + outputAmount);

        if (amount !== outputTotal) {
            console.error('amount is invalid');
            return false;
        }

        if (!verifySignature({publicKey: address, data: outputMap, signature})) {
            console.error('signature is invalid');
            return false;
        }
        return true;
    }

    update({senderWallet, recipient, amount}) {
        if (!this.outputMap[recipient]) {
            this.outputMap[recipient] = amount;
        } else {
            this.outputMap[recipient] = this.outputMap[recipient] + amount;
        }
        this.outputMap[senderWallet.publicKey] -= amount;

        if (this.outputMap[senderWallet.publicKey] < 0) {
            throw new Error('amount exceeds balance');
        }

        this.input = this.createInput({senderWallet, outputMap: this.outputMap});
    }
}

module.exports = Transaction;
