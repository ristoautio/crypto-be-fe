const BlockChain = require('./index');
const Block = require('./block');
const cryptoHash = require('../util/crypto-hash');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

describe('Blockchain', () => {

    let blockChain, newChain, originalChain;
    let errorMock, logMock;

    beforeEach(() => {
        blockChain = new BlockChain();
        newChain = new BlockChain();

        originalChain = blockChain.chain;
        errorMock = jest.fn();
        logMock = jest.fn();

        global.console.error = errorMock;
        global.console.log = logMock;
    });

    it('should contain a chain array instance', () => {
        expect(blockChain.chain instanceof Array).toBe(true)
    });

    it('should start with genesis block', () => {
        expect(blockChain.chain[0]).toEqual(Block.genesis());
    });

    it('should add a block to the chain', () => {
        const newData = 'foo bar';
        blockChain.addBlock(newData);
        expect(blockChain.chain[blockChain.chain.length -1].data).toEqual(newData);
    });


    describe('isValidChain()', function () {

        describe('when the chain does not start with the genesis block', function () {
            it('should return false', function () {
                blockChain.chain[0].data = 'fake-stuff';

                expect(BlockChain.isValidChain(blockChain.chain)).toBe(false);
            });
        });

        describe('starts with the genesis block and has multiple blocks', () => {

            beforeEach(() => {
                blockChain.addBlock('foo');
                blockChain.addBlock('bar');
                blockChain.addBlock('more stuff');
            });

            describe('and a lastHash reference has changed', function () {
                it('should return false', function () {
                    blockChain.chain[2].lastHash = 'broken';
                    expect(BlockChain.isValidChain(blockChain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with an invalid field', function () {
                it('should return false', function () {
                    blockChain.chain[2].data = 'bad data';
                    expect(BlockChain.isValidChain(blockChain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with a jumped difficulty', function () {
                it('should return false', function () {
                    const lastBlock = blockChain.chain[blockChain.chain.length -1];
                    const lastHash = lastBlock.hash;
                    const timestamp = new Date();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty - 2;

                    const hash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);
                    const badBlock = new Block({timestamp, hash, lastHash, data, nonce, difficulty});
                    blockChain.chain.push(badBlock);

                    expect(BlockChain.isValidChain(blockChain.chain)).toBe(false);
                });
            });

            describe('and the chain does not contain any invalid blocks', () => {
                it('should return true', function () {
                    expect(BlockChain.isValidChain(blockChain.chain)).toBe(true);
                });
            })
        })
    });

    describe('replaceChain()', () => {
        describe('when the new chain is not longer', function () {
            beforeEach(() => {
                newChain.chain[0] = {new: 'foo'};
                blockChain.replaceChain(newChain.chain);
            });

            it('should not replace the chain', function () {
                expect(blockChain.chain).toEqual(originalChain)
            });

            it('should log error', function () {
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('when the chain is longer', function () {

            beforeEach(() => {
                newChain.addBlock('foo');
                newChain.addBlock('bar');
                newChain.addBlock('more stuff');
            });


            describe('and the chain is invalid', function () {
                it('should not replace the chain', function () {
                    newChain.chain[2].hash = 'faky';
                    blockChain.replaceChain(newChain.chain, false);
                    expect(blockChain.chain).toEqual(originalChain);
                });
            });

            describe('and the chain is valid', function () {
                it('should replace the chain', function () {
                    blockChain.replaceChain(newChain.chain, false);
                    expect(blockChain.chain).toEqual(newChain.chain);
                });
            });
        });

        describe('validateTransactions is called', function () {
            let validateMock;

            beforeEach(() => {
                validateMock = jest.fn();
                blockChain.validTransactionData = validateMock;
                newChain.addBlock({data: 'foo'});
            });

            it('should have been called by default', function () {
                blockChain.replaceChain(newChain.chain);
                expect(validateMock).toHaveBeenCalled();
            });

            it('should have been called when set to true', function () {
                blockChain.replaceChain(newChain.chain, true);
                expect(validateMock).toHaveBeenCalled();
            });

            it('should not have been called when set to false', function () {
                blockChain.replaceChain(newChain.chain, false);
                expect(validateMock).not.toHaveBeenCalled();
            });


        });
    });

    describe('validTransactionData()', function () {
        let transaction, rewardTransaction, wallet;

        beforeEach(() => {
            wallet = new Wallet();
            transaction = wallet.createTransaction({
                chain: blockChain.chain,
                recipient: 'rec',
                amount: 40
            });
            rewardTransaction = Transaction.rewardTransaction({minerWallet: wallet});
        });

        describe('and the transaction data is valid', function () {
            it('should return true', function () {
                newChain.addBlock({data: [transaction, rewardTransaction]});
                const isValid = blockChain.validTransactionData({chain: newChain.chain});

                expect(isValid).toBe(true);
                expect(errorMock).not.toHaveBeenCalled();
            });
        });

        describe('and the transaction data has multiple rewards', function () {
            it('should return false', function () {
                newChain.addBlock({data: [transaction, rewardTransaction, rewardTransaction]});
                const isValid = blockChain.validTransactionData({chain: newChain.chain});
                expect(isValid).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('and the transaction data has at least one malformed outputMap', function () {
            describe('and the transaction is not a reward transaction', function () {
                it('should return false', function () {
                    transaction.outputMap[wallet.publicKey] = 99999;
                    newChain.addBlock({data: [transaction, rewardTransaction]});
                    const isValid = blockChain.validTransactionData({chain: newChain.chain});
                    expect(isValid).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('and the transaction is a reward transaction', function () {
                it('should return false', function () {
                    rewardTransaction.outputMap[wallet.publicKey] = 99999;
                    newChain.addBlock({data: [transaction, rewardTransaction]});
                    const isValid = blockChain.validTransactionData({chain: newChain.chain});
                    expect(isValid).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });

        describe('and the transaction data has at least one malformed input', function () {
            it('should return false', function () {

                wallet.balanace = 9000;
                const evilOutputMap = {
                    [wallet.publicKey]: 8900,
                    fooRecipient: 100
                };

                let evilTransaction = {
                    input: {
                        timestamp: Date.now(),
                        amount: wallet.balanace,
                        address: wallet.publicKey,
                        signature: wallet.sign(evilOutputMap)
                    },
                    outputMap: evilOutputMap
                };


                newChain.addBlock({data: [evilTransaction, rewardTransaction]});
                const isValid = blockChain.validTransactionData({chain: newChain.chain});
                expect(isValid).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('and a block contains multiple identical transactions', function () {
            it('should return false', function () {
                newChain.addBlock({data: [transaction, rewardTransaction, transaction, transaction]});
                const isValid = blockChain.validTransactionData({chain: newChain.chain});

                expect(isValid).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });

    });
});
