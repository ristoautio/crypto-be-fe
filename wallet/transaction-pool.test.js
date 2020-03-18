const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('../wallet');
const BlockChain = require('../blockchain');

describe('TransactionPool', function () {

    let transactionPool, transaction, senderWallet;

    beforeEach(() => {
        senderWallet = new Wallet();
        transactionPool = new TransactionPool();
        transaction = new Transaction({
            senderWallet: senderWallet,
            recipient: 'fake-recipient',
            amount: 50
        })
    });

    describe('setTransaction()', function () {

        it('should add a transaction', function () {
            transactionPool.setTransaction(transaction);
            expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
        });

    });

    describe('existingTransaction()', function () {
        it('should return existing transaction given an input address', function () {
            transactionPool.setTransaction(transaction);

            const action = transactionPool.existingTransaction({inputAddress: senderWallet.publicKey})
            expect(action).toBe(transaction);
        });
    });

    describe('validTransactions()', function () {
        let validTransactions, errorMock;

        beforeEach(() => {
            validTransactions = [];
            errorMock = jest.fn();
            global.console.error = errorMock;

            for (let i = 0; i < 10; i++) {
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'some-rec',
                    amount: 30
                });

                if (i%3 === 0) {
                    transaction.input.amount = 99999;
                } else if ( i === 1 ) {
                    transaction.input.signature = new Wallet().sign('foo');
                } else {
                    validTransactions.push(transaction);
                }

                transactionPool.setTransaction(transaction);
            }

        });

        it('should return valid transaction and errors have been logged', function () {
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
            expect(errorMock).toHaveBeenCalled();
        });
    });

    describe('clear()', function () {

        it('should clear transactions', function () {
            transactionPool.clear();
            expect(transactionPool.transactionMap).toEqual({});
        });
    });

    describe('clearBlockchainTransactions()', function () {
        it('should clear the pool of any existing blockchain transactions', function () {
            const blockChain = new BlockChain();
            const expectedTransactionMap = {};

            for (let i = 0; i < 6; i++) {
                let t = new Wallet().createTransaction({amount: 20, recipient: 'some'});
                transactionPool.setTransaction(t);

                if (i % 2 === 0) {
                    blockChain.addBlock({data: [t]});
                } else {
                    expectedTransactionMap[t.id] = t;
                }
            }

            transactionPool.clearBlockchainTransaction({chain: blockChain.chain});


            expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
        });
    });
});
