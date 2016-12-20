'use strict';                                   // eslint-disable-line strict

const crypto = require('crypto');
const fs = require('fs');

const GF = require('../../index');
const utils = require('../../tools/utils');

const KB = 1024;
const MB = KB * KB;
const GB = KB * MB;

function genArrPow(start, end, base) {
    const arr = [];
    let val = start;
    while (val <= end) {
        arr.push(val);
        val = val * base;
    }
    return arr;
}

function genArrAdd(start, end, step) {
    const arr = [];
    let val = start;
    while (val <= end) {
        arr.push(val);
        val = val + step;
    }
    return arr;
}

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

function createCauchyMatrix(gf, rowsNb, colsNb) {
    const xArr = [];
    const yArr = [];
    const mat = [];
    let idx;
    for (idx = 0; idx < rowsNb; idx++) {
        xArr.push(idx);
    }
    for (; idx < rowsNb + colsNb; idx++) {
        yArr.push(idx);
    }
    for (let row = 0; row < rowsNb; row++) {
        for (let col = 0; col < colsNb; col++) {
            mat.push(gf.inverse(gf.add(xArr[row], yArr[col])));
        }
    }
    return mat;
}

const dataNb = 10;
const parityNb = 4;
const codeLen = dataNb + parityNb;
let matrix;
let encodeContextId;
const sizes = genArrPow(KB * codeLen, 16 * MB * codeLen, 2);
const smallSizes = genArrAdd(KB * codeLen, 64 * KB * codeLen, KB * codeLen);
const largeSizes = genArrAdd(96 * KB * codeLen, MB * codeLen,
    32 * KB * codeLen);
const bigSizes = genArrAdd(MB * codeLen, 8 * MB * codeLen, MB * codeLen);
const fullSizes = smallSizes.concat(largeSizes).concat(bigSizes);
// const stripes = sizes.map(size => crypto.randomBytes(size));
const itersNb = 1e3;
const ALIGN_SIZE = 32;

let gf;

const params = {
    stripeSize: sizes.map(size => getSizeStr(size)),
    erasureCodes: {
        dataNb,
        parityNb,
    },
    simulation: {
        iterationsNb: itersNb,
    },
};
utils.show(params, 'Common parameters');

const benchResult = {};
const benchResultFile = `${__dirname}/benchmark.csv`;
fs.writeFileSync(benchResultFile,
    'Benchmark multiRegion performance (MB/s)\n\nParameters\n');

fs.appendFileSync(benchResultFile, JSON.stringify(params, null, 4));
/**
 * Perform encoding on a stripe, each multiplication is sent to addon
 * @param {Object} gf - galois field instance
 * @param {Number} encodeContextId - context ID
 * @param {Number[]} mat - encoding matrix
 * @param {Object} stripe - stripe to be encoded
 * @param {Number} chunkSize - chunk (fragment) size
 * @return {undefined}
 */
function doEncodeIndiv(gf, encodeContextId, mat, stripe, chunkSize) {
    const dFrags = {};
    const pFrags = {};
    let start = 0;
    let idx;
    for (idx = 0; idx < dataNb; idx++, start += chunkSize) {
        dFrags[idx] = stripe.slice(start, start + chunkSize);
    }
    for (idx = 0; idx < parityNb; idx++, start += chunkSize) {
        pFrags[idx] = stripe.slice(start, start + chunkSize);
    }

    for (let row = 0; row < parityNb; row++) {
        let dIdx = 0;
        let coefIdx = row * dataNb;
        // init parities
        gf.multRegion(mat[coefIdx++], dFrags[dIdx], pFrags[row], chunkSize, 0);
        // sequentially update parites for next dFrags
        for (dIdx = 1; dIdx < dataNb; dIdx++) {
            gf.multRegion(mat[coefIdx++], dFrags[dIdx], pFrags[row],
                chunkSize, 1);
        }
    }
}

/**
 * Perform encoding on a stripe, all multiplications are once sent to addon
 * @param {Object} gf - galois field instance
 * @param {Number} encodeContextId - context ID
 * @param {Number[]} mat - encoding matrix
 * @param {Object} stripe - stripe to be encoded
 * @param {Number} chunkSize - chunk (fragment) size
 * @return {undefined}
 */
function doEncodeMatrix(gf, encodeContextId, mat, stripe, chunkSize) {
    gf.multRegionMatrix(mat, parityNb, dataNb,
        stripe, stripe, chunkSize, dataNb * chunkSize);
}

/**
 * Perform encoding on a stripe, all multiplications are once sent to addon
 *  Multi-threads are used: each parity is calculated in a thread
 * @param {Object} gf - galois field instance
 * @param {Number} encodeContextId - context ID
 * @param {Number[]} mat - encoding matrix
 * @param {Object} stripe - stripe to be encoded
 * @param {Number} chunkSize - chunk (fragment) size
 * @return {undefined}
 */
function doEncodeMatrixBoost(gf, encodeContextId, mat, stripe, chunkSize) {
    gf.multRegionMatrixThreads(mat, parityNb, dataNb,
        stripe, stripe, chunkSize, dataNb * chunkSize);
}

/**
 * Perform encoding on a stripe, all multiplications are once sent to addon
 *  Use context that contains common info for all stripes: dataNb,
 *      parityNb, encoding matrix, chunk size.
 * @param {Object} gf - galois field instance
 * @param {Number} encodeContextId - context ID
 * @param {Number[]} mat - encoding matrix
 * @param {Object} stripe - stripe to be encoded
 * @param {Number} chunkSize - chunk (fragment) size
 * @return {undefined}
 */
function doEncodeContext(gf, encodeContextId, mat, stripe, chunkSize) {
    gf.multRegionMatrixContext(encodeContextId,
        stripe, stripe, chunkSize, dataNb * chunkSize);
}

/**
 * Perform encoding on a stripe, all multiplications are once sent to addon
 *  Use context that contains common info for all stripes: dataNb,
 *      parityNb, encoding matrix, chunk size.
 *  Multi-threads are used: each parity is calculated in a thread
 * @param {Object} gf - galois field instance
 * @param {Number} encodeContextId - context ID
 * @param {Number[]} mat - encoding matrix
 * @param {Object} stripe - stripe to be encoded
 * @param {Number} chunkSize - chunk (fragment) size
 * @return {undefined}
 */
function doEncodeContextBoost(gf, encodeContextId, mat, stripe, chunkSize) {
    gf.multRegionMatrixThreadsContext(encodeContextId,
        stripe, stripe, chunkSize, dataNb * chunkSize);
}

const encodeMethods = [doEncodeIndiv, doEncodeMatrix, doEncodeMatrixBoost,
    doEncodeContext, doEncodeContextBoost];
const encodeName = ['doEncodeIndiv', 'doEncodeMatrix', 'doEncodeMatrixBoost',
    'doEncodeContext', 'doEncodeContextBoost'];

function createHeader() {
    let colHd = ['Fragment size\\Encode method'];
    colHd = colHd.concat(encodeName);
    const rowHd = fullSizes.map(objSize => getSizeStr(objSize));
    return {
        col: colHd.join(','),
        row: rowHd.join(','),
    };
}

const headers = createHeader();
function saveResult(name, result) {
    const content = [`\n\n${name}\n`, headers.col];
    Object.keys(result).forEach(row => {
        const arr = [`\n${row}`];
        Object.keys(result[row]).forEach(col => {
            arr.push(result[row][col]);
        });
        content.push(arr.join(','));
    });
    fs.appendFileSync(benchResultFile, content.join(''));
}

function test(options, result) {
    before('Init GF', () => {
        utils.show(options, 'GF options');
        gf = new GF(options);
        matrix = createCauchyMatrix(gf, parityNb, dataNb);
        fullSizes.forEach(size => {
            let chunkSize = Math.floor(size / codeLen);
            while (chunkSize % ALIGN_SIZE !== 0) {
                chunkSize--;
            }
            // eslint-disable-next-line
            result[getSizeStr(chunkSize)] = {};
        });
    });

    encodeMethods.forEach((enc, encIdx) => {
        fullSizes.forEach(size => {
            const name = [encodeName[encIdx], ': stripe',
                getSizeStr(size), ', fragment size',
                getSizeStr(size / codeLen)].join(' ');
            it(name, () => {
                const stripe = crypto.randomBytes(size);
                let chunkSize = Math.floor(size / codeLen);
                while (chunkSize % ALIGN_SIZE !== 0) {
                    chunkSize--;
                }
                encodeContextId =
                    gf.initContext(matrix, parityNb, dataNb, chunkSize);
                const start = process.hrtime();
                for (let idx = 0; idx < itersNb; idx++) {
                    enc(gf, encodeContextId, matrix, stripe, chunkSize);
                }
                const time = utils.getHrTime(start) / itersNb / 1e3;
                const thrput = size / MB / time;
                // eslint-disable-next-line
                result[getSizeStr(chunkSize)][encodeName[encIdx]] = thrput;
                // utils.show(thrput, `${name} => encode speed (MB/s)`);
            });
        });
    });

    after('Save result', () => {
        saveResult(`Benchmark ${JSON.stringify(options)}`, result);
    });
}

let options = {
    gfDim: 8,
    multType: 'split',
    arg1: 4,
    arg2: 8,
};
describe('Performance tests with GF(8)', function cb() {
    this.timeout(0);
    benchResult.GF8 = {};
    test(options, benchResult.GF8);
});

options = {
    gfDim: 16,
    multType: 'split',
    regionType: 'altmap',
    arg1: 4,
    arg2: 16,
};
describe('Performance tests with GF(16)', function cb() {
    this.timeout(0);
    benchResult.GF16 = {};
    test(options, benchResult.GF16);
});
