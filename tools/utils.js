'use strict';                                   // eslint-disable-line strict

/** @file
 * This module implements methods operating on matrix
 *  Essential functions:
 *  - constructOptPcm(gf, dataNb, parityNb): constructs optimized parity-check
 *      matrix (PCM) and encoding matrix
 *  - getDecMatrix(gf, mat, erasureList): constructs decoding matrix to
 *      reconstruct erasures as well as to encode
 *  - constructPcm(gf, dataNb, parityNb); constructs an ordinary PCM of
 *      Reed-Solomon codes
 */

const util = require('util');

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const randIndex = Math.floor(Math.random() * i);
        const randIndexVal = array[randIndex];
        array[randIndex] = array[i];            // eslint-disable-line
        array[i] = randIndexVal;                // eslint-disable-line
    }
    return array;
}

function getRandIdx(len, nb) {
    const array = [];
    for (let idx = 0; idx < len; idx++) {
        array.push(idx);
    }
    return shuffle(array).slice(0, nb);
}

function getHrTime(start) {
    const end = process.hrtime(start);
    return (end[0] * 1e3 + end[1] / 1e6);
}

/**
 * Show an object
 * @param {Object} obj - object to show
 * @param {String} [legend] - legend
 * @param {Object} [opts] - showing options
 * @param {Boolen} [opts.showHidden] - flag showing hidden properties
 * @param {Number} [opts.depth] - showing depth
 * @return {undefined}
 */
function show(obj, legend, opts) {
    if (legend) {
        process.stdout.write(`${legend}\n`);
    }
    process.stdout.write(util.inspect(obj, opts));
    process.stdout.write('\n');
}

module.exports = {
    getHrTime,
    getRandIdx,
    show,
};
