const Wallet = require('./index');
const { verifySignature } = require('../util');
const BlockChain = require('../blockchain');
const Transaction = require('../wallet/transaction');
const {STARTING_BALANCE} = require('../config');

describe('Wallet', function () {

    let wallet;

    beforeEach(() => {
        wallet = new Wallet();
    });

    it('should have a `balance`', function () {
        expect(wallet).toHaveProperty('balance')
    });

    it('should have a `publicKey`', function () {
        expect(wallet).toHaveProperty('publicKey')
    });

    describe('signing data', function () {
        const data = 'foobar';

        it('should verify a signature', function () {
            const verified = verifySignature({
                publicKey: wallet.publicKey,
                data: data,
                signature: wallet.sign(data)
            });
            expect(verified).toBe(true);
        });

        it('should not verify invalid signature', function () {
            const verified = verifySignature({
                publicKey: wallet.publicKey,
                data: data,
                signature: new Wallet().sign(data)
            });
            expect(verified).toBe(false);
        });
    });

    describe('createTransaction()', function () {
        describe('and the amount exceeds the balance', function () {
            it('should throw an error', function () {
                expect(() => wallet.createTransaction({amount: 999999, recipient: 'foo-rec'}))
                    .toThrow('Amount exceeds balance');
            });
        });

        describe('and the amount is valid', function () {
            let transaction, amount, recipient;

            beforeEach(() => {
                amount = 50;
                recipient = 'foo-rec';
                transaction = wallet.createTransaction({amount, recipient});
            });

            it('should create instance of transaction', function () {
                const transaction = wallet.createTransaction({amount: 11, recipient: 'foo-rec'});
                expect(transaction)
            });

            it('should match the input with the wallet', function () {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it('should output the amount to the recipient', function () {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });

        describe('and a chain is passed', function () {

            it('should call `Wallet.calculateBalance`', function () {

                const calculateWalletBalanceMock = jest.fn();
                const originalCalculateBalance = Wallet.calculateBalance;
                Wallet.calculateBalance = calculateWalletBalanceMock;

                wallet.createTransaction({
                    amount: 200,
                    recipient: 'foo-rec',
                    chain: new BlockChain()
                });

                expect(calculateWalletBalanceMock).toHaveBeenCalled();
                Wallet.calculateBalance = originalCalculateBalance;
            });
        });
    });

    describe('calculateBalance()', function () {
        let blockChain;

        beforeEach(() => {
            blockChain = new BlockChain();
        });

        describe('there are no outputs for the wallet', function () {
            it('should return the `STARTING_BALANCE`', function () {
                const balance = Wallet.calculateBalance({
                    chain: blockChain.chain,
                    address: wallet.publicKey
                });

                expect(balance).toEqual(STARTING_BALANCE);
            });
        });

        describe('there are outputs for the wallet', function () {
            let transactionOne, transactionTwo, transactionThree;

            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 50
                });
                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 60
                });
                transactionThree = new Wallet().createTransaction({
                    recipient: new Wallet().publicKey,
                    amount: 200
                });
                blockChain.addBlock({data: [transactionOne, transactionTwo, transactionThree]});
            });


            it('should add the sum of all outputs to the wallet balance', function () {
                const balance = Wallet.calculateBalance({
                    chain: blockChain.chain,
                    address: wallet.publicKey
                });
                const expectedBalance = STARTING_BALANCE + transactionOne.amount + transactionTwo.amount;
                expect(balance).toEqual(expectedBalance);
            });

            describe('and the wallet has made a transaction', function () {
                let recentTransaction;

                beforeEach(() => {
                    recentTransaction = wallet.createTransaction({
                        amount: 20,
                        recipient: 'foo-rec'
                    });
                    blockChain.addBlock({data: [recentTransaction]});
                });

                it('should return output amount of the recent transaction', function () {
                    const balance = Wallet.calculateBalance({
                        chain: blockChain.chain,
                        address: wallet.publicKey
                    });
                    expect(balance).toEqual(recentTransaction.outputMap[wallet.publicKey]);
                });

                describe('and there are outputs next to and after the recent transaction', function () {
                    let sameBlockTransaction, nextBlockTransaction;

                    beforeEach(() => {
                        recentTransaction = wallet.createTransaction({
                            amount: 60,
                            recipient: 'some-rec'
                        });

                        sameBlockTransaction = Transaction.rewardTransaction({minerWallet: wallet})
                        blockChain.addBlock({data: [recentTransaction, sameBlockTransaction]});

                        nextBlockTransaction = new Wallet().createTransaction({
                           amount: 75,
                           recipient: wallet.publicKey
                        });

                        blockChain.addBlock({data: [nextBlockTransaction]});
                    });

                    it('should include the output amount in the balance', function () {
                        const balance = Wallet.calculateBalance({
                            chain: blockChain.chain,
                            address: wallet.publicKey
                        });

                        const expectedBalance = recentTransaction.outputMap[wallet.publicKey] +
                            sameBlockTransaction.outputMap[wallet.publicKey] +
                            nextBlockTransaction.outputMap[wallet.publicKey];
                        expect(balance).toEqual(expectedBalance);
                    });
                });
            });
        });
    });

});


