const {GENESIS_DATA, MINE_RATE} = require('../config');
const {cryptoHash} = require('../util');
const hexToBinary = require('hex-to-binary');

class Block {

    constructor({timestamp, hash, lastHash, data, nonce, difficulty}) {
        this.timestamp = timestamp;
        this.hash = hash;
        this.lastHash = lastHash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    static mineBlock({lastBlock, data}) {
        const {difficulty} = lastBlock;

        let content = {
            timestamp: new Date(),
            lastHash: lastBlock.hash,
            difficulty: difficulty,
            nonce: 0,
            data: data,
            hash: '1'
        };

        do {
            content.nonce += 1;
            content.timestamp = new Date();
            content.difficulty = this.adjustDifficulty({originalBlock: lastBlock, timestamp: content.timestamp});
            content.hash = cryptoHash(content.timestamp, content.lastHash, content.data, content.nonce, content.difficulty);
        } while (hexToBinary(content.hash).substring(0, content.difficulty) !== '0'.repeat(content.difficulty));

        return new Block(content);
    }

    static genesis() {
        return new Block(GENESIS_DATA);
    }

    static adjustDifficulty({originalBlock, timestamp}) {
        const {difficulty} = originalBlock;
        if (difficulty < 1) {
            return 1;
        }
        const difference = timestamp - originalBlock.timestamp;
        return difficulty + ((difference > MINE_RATE) ? -1 : 1);
    }

}

module.exports = Block;
