const Transaction = require('../wallet/transaction');

class TransactionMiner {

    constructor({blockChain, transactionPool, wallet, pubsub}) {
        this.blockChain = blockChain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubsub = pubsub;
    }

    mineTransaction() {
        let transactions = this.transactionPool.validTransactions();

        const reward = Transaction.rewardTransaction({minerWallet: this.wallet});

        transactions.push(reward);
        this.blockChain.addBlock({data: transactions});

        this.pubsub.broadcastChain();

        this.transactionPool.clear();
    }

}

module.exports = TransactionMiner;

