const Transaction = require('./transaction');
const Wallet = require('./index');
const {verifySignature} = require('../util');
const {REWARD_INPUT, MINING_REWARD} = require('../config');

describe('Transaction', function () {
    let transaction, senderWallet, recipient, amount;

    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key';
        amount = 50;

        transaction = new Transaction({senderWallet, recipient, amount});
    });

    it('should have an `id`', function () {
        expect(transaction).toHaveProperty('id');
    });

    describe('outputMap', function () {

        it('should have an `outputMap`', function () {
            expect(transaction).toHaveProperty('outputMap');
        });

        it('should have amount for recipient', function () {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });

        it('should output the remaining balance for the `senderWaller`', function () {
            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
        });
    });

    describe('input', function () {

        it('should have an `input`', function () {
            expect(transaction).toHaveProperty('input');
        });

        it('should have a `timestamp` in the input', function () {
            expect(transaction.input).toHaveProperty('timestamp');
        });

        it('should set amount to the sender wallet balance', function () {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('should contain the sender wallets public key', function () {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('should sign the input', function () {
            const verified = verifySignature( {
                publicKey: senderWallet.publicKey,
                data: transaction.outputMap,
                signature: transaction.input.signature
            } );
            expect(verified).toBe(true);
        });
    });

    describe('validTransaction()', function () {
        let errorMock;
        beforeEach(() => {
            errorMock = jest.fn();
            global.console.error = errorMock;
        });

        describe('should be valid transaction', function () {
            it('should return true', function () {
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
        });

        describe('should be invalid', function () {
            describe('and a transaction outputmap is invalid', function () {
                it('should return false', function () {
                    transaction.outputMap[senderWallet.publicKey] = 9999999;
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('the transaction input signature is invalid', function () {
                it('should return false', function () {
                    transaction.input.signature = new Wallet().sign('foo');
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
    });

    describe('update()', function () {

        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

        describe('and the amount is valid', function () {
            beforeEach(() => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = 'next-rec';
                nextAmount = 50;

                transaction.update({senderWallet, recipient: nextRecipient, amount: nextAmount});
            });

            it('should output the amount to the next recipient', function () {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });

            it('should subtract the amount from the original sender output amount', function () {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
            });

            it('should maintains a total output that matches the amount', function () {
                const total = Object.values(transaction.outputMap).reduce((total, outputAmount) => total + outputAmount);
                expect(total).toEqual(transaction.input.amount);
            });

            it('should re-signs the transaction', function () {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe('and another update for the same recipient', function () {
                let addedAmount;

                beforeEach(() => {
                    addedAmount = 80;
                    transaction.update({senderWallet, recipient: nextRecipient, amount: addedAmount});
                });

                it('should add to recipient amount', function () {
                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + addedAmount);
                });

                it('should subtract amount from the original sender', function () {
                    expect(transaction.outputMap[senderWallet.publicKey])
                        .toEqual(originalSenderOutput - nextAmount - addedAmount)
                });
            });
        });

        describe('and the amount is invalid', function () {
            it('should throw an error', function () {
                expect(() => transaction.update({senderWallet, recipient: 'foo', amount: 999999}))
                    .toThrow('amount exceeds balance');
            });
        });

    });

    describe('rewardTransaction()', function () {
        let rewardTransaction, minerWallet;

        beforeEach(() => {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({minerWallet})
        });

        it('should create a transaction', function () {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });

        it('should create one transaction with `MINING_REWARD`', function () {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        });
    });
});
