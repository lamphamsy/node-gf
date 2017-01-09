'use strict';                                   // eslint-disable-line strict

const crypto = require('crypto');

const GF = require('../../index');
const utils = require('../../tools/utils');

const KB = 1024;
const MB = KB * KB;
const GB = KB * MB;

function getSizeStr(size) {
    if (size < KB) {
        return `${size}B`;
    } else if (size < MB) {
        return `${size / KB}KB`;
    } else if (size < GB) {
        return `${size / MB}MB`;
    }
    return `${size / GB}GB`;
}

const sizes = [KB, 5 * KB, 10 * KB, 20 * KB, 30 * KB, 50 * KB, 64 * KB,
    128 * KB, 256 * KB, 512 * KB, MB, 2 * MB, 3 * MB, 5 * MB];
const itersNb = [1e6, 1e6, 1e6, 1e6, 1e5, 1e5, 1e5, 1e5, 1e5, 1e5, 1e4, 1e4,
    1e4, 1e4, 1e4, 1e4];
const times = sizes.map(() => 0);
const throughput = {};

let gfDim;
let gfCard;
let gf;
let xorFlag;

function test(gfDim, xorFlag) {
    before('Init GF', () => {
        gfCard = Math.pow(2, gfDim);
        gf = new GF({ gfDim });
    });

    it('multRegion', () => {
        sizes.forEach((size, sizeIdx) => {
            const bufA = crypto.randomBytes(size);
            const bufB = crypto.randomBytes(size);
            const start = process.hrtime();
            for (let idx = 0; idx < itersNb[sizeIdx]; idx++) {
                const symb = Math.floor(Math.random() * (gfCard - 1)) + 1;
                gf.multRegion(symb, bufA, bufB, size, xorFlag);
            }
            times[sizeIdx] = utils.getHrTime(start) / itersNb[sizeIdx] / 1e3;
            utils.show(times[sizeIdx],
                `multRegion: ${getSizeStr(size)} (s)`);
        });
        sizes.forEach((size, idx) => {
            const sizeStr = getSizeStr(size);
            throughput[sizeStr] = (size / MB / times[idx]).toFixed(0);
        });
        utils.show(throughput, 'multRegion speed (MB/s)');
    });
}

gfDim = 8;
xorFlag = 0;
describe(`Performance tests with GF(${gfDim}) xor ${xorFlag}`, function cb() {
    this.timeout(0);
    test(gfDim, xorFlag);
});

gfDim = 8;
xorFlag = 1;
describe(`Performance tests with GF(${gfDim}) xor ${xorFlag}`, function cb() {
    this.timeout(0);
    test(gfDim, xorFlag);
});
