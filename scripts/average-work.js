const BlockChain = require('../blockchain');

const blockChain = new BlockChain();

blockChain.addBlock('some stuff');

let prevTimestamp, nextTimestamp, nextBlock, timeDiff, average;

const times = [];

for (let i = 0; i < 1000; i++) {
    prevTimestamp = blockChain.chain[blockChain.chain.length-1].timestamp;
    blockChain.addBlock('foo ' +i);
    nextBlock = blockChain.chain[blockChain.chain.length-1];
    nextTimestamp = nextBlock.timestamp;
    timeDiff = nextTimestamp - prevTimestamp;
    times.push(timeDiff);
    average = times.reduce((total, num) => (total + num))/times.length;

    console.log(`time to mine block: ${timeDiff}ms. Difficulty: ${nextBlock.difficulty}. Average time: ${average}ms.`)
}

