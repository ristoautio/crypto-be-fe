const crypto = require('crypto');

const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');
    const toHash = inputs.map(i => JSON.stringify(i)).sort().join(' ');
    hash.update(toHash);
    return hash.digest('hex');
};

module.exports = cryptoHash;
