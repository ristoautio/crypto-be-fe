const express = require('express');
const BlockChain = require('./blockchain');
const bodyParser = require('body-parser');
const PubSub = require('./app/pubsub');
const request = require('request');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

const app = express();
const blockChain = new BlockChain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

let port = DEFAULT_PORT;
if (process.env.GENERATE_PEER_PORT === 'true') {
    port = DEFAULT_PORT + Math.ceil(Math.random()*1000);
}

const pubsub = new PubSub({blockChain, transactionPool});
const transactionMiner = new TransactionMiner({transactionPool, pubsub, blockChain, wallet})

setTimeout(() => pubsub.broadcastChain(), 2000);

app.use(bodyParser.json());

const syncRootState = () => {
    request({url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);
            blockChain.replaceChain(rootChain);
        }
    });

    request({url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`}, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootTransactionPoolMap = JSON.parse(body);
            console.log('replace transaction pool map on sync', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    })
};

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/api/blocks', (req, res) => res.json(blockChain.chain));

app.post('/api/mine', (req, res) => {
    const { data } = req.body;
    blockChain.addBlock(data);
    pubsub.broadcastChain();
    return res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;
    res.json({
        address: address,
        balance: Wallet.calculateBalance({chain: blockChain.chain, address})
    });
});

app.get('/api/transaction-pool-map', (req, res) => {
    return res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransaction();
    return res.redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
    const {amount, recipient} = req.body;

    let transaction = transactionPool.existingTransaction({inputAddress: wallet.publicKey});
    if (transaction) {
        transaction.update({senderWallet: wallet, recipient, amount});
    } else {
        transaction = wallet.createTransaction({recipient, amount, chain: blockChain.chain});
        transactionPool.setTransaction(transaction);
    }

    pubsub.broadcastTransaction(transaction);
    return res.json({transaction});
});


function errorHandler (err, req, res, next) {
    res.status(500);
    res.json({ error: err.message });
}
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    syncRootState();
});
