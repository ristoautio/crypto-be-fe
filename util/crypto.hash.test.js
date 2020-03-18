const cryptoHash = require('./crypto-hash');

describe('cryptoHash', () => {

    const shaIn = "test";
    const shaOut = "4d967a30111bf29f0eba01c448b375c1629b2fed01cdfcc3aed91f1b57d5dd5e";

    it('should produce sha256 output', () => {
        expect(cryptoHash(shaIn)).toEqual(shaOut)
    });

    it('should produce same hash with arguments in any order', function () {
        expect(cryptoHash('one', 'two', 'three')).toEqual(cryptoHash('two', 'one', 'three'))
    });

    it('should produce a unique has when the properties have changed', function () {
        const foo = {};
        const originalHash = cryptoHash(foo);
        foo['a'] = 'a';

        expect(cryptoHash(foo)).not.toEqual(originalHash);
    });
})
