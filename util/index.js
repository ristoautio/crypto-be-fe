const EC = require('elliptic').ec;
const cryptoHash = require('../util/crypto-hash');

const ec = new EC('secp256k1');

function verifySignature({publicKey, data, signature}){
    const key = ec.keyFromPublic(publicKey, 'hex');
    return key.verify(cryptoHash(data), signature);
}

module.exports = {ec, verifySignature, cryptoHash};
