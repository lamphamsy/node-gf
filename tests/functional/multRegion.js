'use strict';                                   // eslint-disable-line strict

const crypto = require('crypto');

const GF = require('../../index');

const KB = 1024;
const MB = KB * KB;

const objSize = 1 * MB;   // 32 * gfDim * PACKET_SIZE;
const bufA = crypto.randomBytes(objSize);
let bufB = Buffer.allocUnsafe(objSize);

const gfDim = 8;
const gfCard = Math.pow(2, gfDim);
const gf = new GF({ gfDim });

describe('Functional tests', function cb() {
    this.timeout(0);

    it('multRegion no xor', () => {
        const symb = Math.floor(Math.random() * (gfCard - 1)) + 1;
        const hashA = crypto.createHash('md5').update(bufA).digest('hex');
        const invSymb = gf.inverse(symb);
        gf.multRegion(symb, bufA, bufB, objSize, 0);
        gf.multRegion(invSymb, bufB, bufB, objSize, 0);
        const hashB = crypto.createHash('md5').update(bufB).digest('hex');
        if (hashA !== hashB) {
            process.stderr.write('multRegion no xor fails');
        } else {
            process.stdout.write('multRegion no xor succeeds');
        }
    });


    it('multRegion with xor', () => {
        bufB = crypto.randomBytes(objSize);
        const hashB = crypto.createHash('md5').update(bufB).digest('hex');
        const symb = Math.floor(Math.random() * (gfCard - 1)) + 1;
        gf.multRegion(symb, bufA, bufB, objSize, 1);
        gf.multRegion(symb, bufA, bufB, objSize, 1);
        const _hashB = crypto.createHash('md5').update(bufB).digest('hex');
        if (_hashB !== hashB) {
            process.stderr.write('multRegion with xor fails');
        } else {
            process.stdout.write('multRegion with xor succeeds');
        }
    });

    it('multRegionArr with xor', () => {
        const destsNb = 10;
        const bufBs = [];
        const hashBs = [];
        const coefs = [];
        for (let idx = 0; idx < destsNb; idx++) {
            bufBs[idx] = crypto.randomBytes(objSize);
            hashBs[idx] = crypto.createHash('md5').update(bufBs[idx]).
                digest('hex');
            coefs[idx] = Math.floor(Math.random() * (gfCard - 1)) + 1;
        }

        gf.multRegionArr(coefs, bufA, bufBs, destsNb, objSize, 1);
        gf.multRegionArr(coefs, bufA, bufBs, destsNb, objSize, 1);
        for (let idx = 0; idx < destsNb; idx++) {
            const _hashB = crypto.createHash('md5').update(bufBs[idx]).
                digest('hex');
            if (_hashB !== hashBs[idx]) {
                process.stderr.write(`${idx}: multRegionArr with xor fails\n`);
            } else {
                process.stdout.write(
                    `${idx}: multRegionArr with xor succeeds\n`);
            }
        }
    });

    it('multRegionArrThreads with xor', () => {
        const destsNb = 10;
        const bufBs = [];
        const hashBs = [];
        const coefs = [];
        for (let idx = 0; idx < destsNb; idx++) {
            bufBs[idx] = crypto.randomBytes(objSize);
            hashBs[idx] = crypto.createHash('md5').update(bufBs[idx]).
                digest('hex');
            coefs[idx] = Math.floor(Math.random() * (gfCard - 1)) + 1;
        }

        gf.multRegionArrThreads(coefs, bufA, bufBs, destsNb, objSize, 1);
        gf.multRegionArrThreads(coefs, bufA, bufBs, destsNb, objSize, 1);
        for (let idx = 0; idx < destsNb; idx++) {
            const _hashB = crypto.createHash('md5').update(bufBs[idx]).
                digest('hex');
            if (_hashB !== hashBs[idx]) {
                process.stderr.write(`${idx}: multRegionArr with xor fails\n`);
            } else {
                process.stdout.write(
                    `${idx}: multRegionArr with xor succeeds\n`);
            }
        }
    });
});
