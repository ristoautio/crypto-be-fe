const Block = require('./block');
const {GENESIS_DATA, MINE_RATE} = require('../config');
const cryptoHash = require('../util/crypto-hash');
const hexToBinary = require('hex-to-binary');

describe('Block', () => {
    const timestamp = 2000;
    const hash = 'dummy-hash';
    const lastHash = 'dummy-lastHash';
    const data = 'dummy-data';

    const nonce = 1;
    const difficulty = 1;
    const block = new Block({timestamp, hash, lastHash, data, nonce, difficulty});

    it('has properties set', () => {
        expect(block.timestamp).toEqual(timestamp);
        expect(block.hash).toEqual(hash);
        expect(block.lastHash).toEqual(lastHash);
        expect(block.data).toEqual(data);
        expect(block.nonce).toEqual(nonce);
        expect(block.difficulty).toEqual(difficulty);
    });


    describe('genesis()', () => {
        const genesisBlock = Block.genesis();

        it('returns block instance', () => {
            expect(genesisBlock instanceof Block).toBe(true);
        });

        it('returns genesis data', () => {
            expect(genesisBlock).toEqual(GENESIS_DATA);
        })
    });


    describe('mineBlock()', () => {
        const lastBlock = Block.genesis();
        const data = 'mined data';
        const difficulty = 1;
        const minedBlock = Block.mineBlock({lastBlock, data, difficulty})

        it('should return instance of Block', function () {
            expect(minedBlock instanceof Block).toBe(true);
        });

        it('should ', function () {
            expect(minedBlock.lastHash).toBe(lastBlock.hash)
        });

        it('should set data', function () {
            expect(minedBlock.data).toEqual(data)
        });

        it('should set a timestamp', function () {
            expect(minedBlock.timestamp).not.toEqual(undefined)
        });

        it('should create a sha256 hash', () => {
            expect(minedBlock.hash)
                .toEqual(cryptoHash(minedBlock.timestamp, minedBlock.nonce, minedBlock.difficulty, lastBlock.hash, data));
        });

        it('should match difficulty criteria', function () {
            expect(hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty)).toEqual('0'.repeat(minedBlock.difficulty))
        });

        it('should adjust the difficulty', function () {
            const possibleResults = [lastBlock.difficulty+1, lastBlock.difficulty-1];
            expect(possibleResults.includes(minedBlock.difficulty)).toBe(true)
        });
    })

    describe('adjustDifficulty()', function () {
        it('should raise difficulty for fast block', function () {
            expect(Block.adjustDifficulty({
                originalBlock: block,
                timestamp: block.timestamp + MINE_RATE - 100}
                )).toEqual(block.difficulty+1)
        });

        it('should lower the difficulty for a slow block', function () {
            expect(Block.adjustDifficulty({
                originalBlock: block,
                timestamp: block.timestamp + MINE_RATE + 100}
            )).toEqual(block.difficulty-1)
        });

        it('should have a lower limit of 1', function () {
            block.difficulty = -1;
            expect(Block.adjustDifficulty({originalBlock: block})).toEqual(1)
        });

    });
});

