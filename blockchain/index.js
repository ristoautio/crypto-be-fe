const Block = require('./block');
const {cryptoHash} = require('../util');
const {REWARD_INPUT, MINING_REWARD} = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Index {

    constructor() {
        this.chain = [Block.genesis()];
    }

    static hashMatches(block) {
        const calcHash = cryptoHash(new Date(block.timestamp), block.lastHash, block.data, block.nonce, block.difficulty);
        return block.hash === calcHash;
    }

    static same(block1, block2) {
        return block1.timestamp === block2.timestamp &&
            block1.hash === block2.hash &&
            block1.lastHash === block2.lastHash &&
            JSON.stringify(block1.data) === JSON.stringify(block2.data) &&
            block1.nonce === block2.nonce &&
            block1.difficulty === block2.difficulty;
    }

    static isValidChain(chain) {
        if (!this.same(chain[0], Block.genesis())) return false;

        for (let i = 0; i < chain.length - 1; i++) {
            if (![chain[i].difficulty + 1, chain[i].difficulty - 1].includes(chain[i + 1].difficulty)) {
                return false;
            }
        }

        return chain
            .filter((it, i) => i !== 0)
            .every((it) => this.hashMatches(it));
    }

    addBlock(data) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data: data
        });
        this.chain.push(newBlock);
    }

    replaceChain(chain, validateTransaction = true, onSuccess) {
        if (chain.length <= this.chain.length) {
            console.error('new chain should be longer');
            return;
        }
        if (!Index.isValidChain(chain)) {
            console.error('chain needs to be valid');
            return;
        }

        if (validateTransaction && !this.validTransactionData({chain})) {
            console.error('the chain has invalid transaction data');
            return;
        }

        if (onSuccess) onSuccess();
        this.chain = chain;
    }

    validTransactionData({chain}) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardCount = 0;

            for (let transaction of block.data.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardCount += 1;
                    if (rewardCount > 1) {
                        console.error('more than one reward in the block');
                        return false;
                    }

                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('mining reward is incorrect');
                        return false
                    }

                } else {
                    if (!Transaction.validTransaction(transaction)) {
                        console.error('transaction is not valid');
                        return false;
                    }
                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });
                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }
                }

                if (transactionSet.has(transaction)) {
                    console.error('Found duplicate transaction in block');
                    return false;
                }
                transactionSet.add(transaction);

            }
        }
        return true;
    }
}

module.exports = Index;
