const Transaction = require('./transaction');

class TransactionPool {

    constructor() {
        this.transactionMap = {};
    }

    setTransaction(transaction) {
        this.transactionMap[transaction.id] = transaction;
    }

    clear() {
        this.transactionMap = {};
    }

    existingTransaction({inputAddress}) {
        return Object.values(this.transactionMap)
            .find((t) => t.input.address === inputAddress);
    }

    setMap(transactionPoolMap) {
        this.transactionMap = transactionPoolMap;
    }

    validTransactions() {
        return Object.values(this.transactionMap)
            .filter((t) => Transaction.validTransaction(t));
    }

    clearBlockchainTransaction({chain}) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];

            for (let transaction of block.data.data) {
                if (this.transactionMap[transaction.id]) {
                    delete this.transactionMap[transaction.id];
                }
            }
        }
    }
}

module.exports = TransactionPool;
