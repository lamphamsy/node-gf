'use strict';                                   // eslint-disable-line strict

const GF = require('../../index');
const utils = require('../../tools/utils');

const gfDim = 8;
const gfCard = Math.pow(2, gfDim);
let gf;

describe('GF: init tests', function cb() {
    this.timeout(0);

    it('wrong gfDim', done => {
        try {
            new GF({ gfDim: 3 });               // eslint-disable-line no-new
            return done('should not be here');
        } catch (error) {
            return done();
        }
    });

    it('multType', done => {
        const multTypes = ['default', 'shift', 'carry_free', 'carry_free_gk',
            'group', 'bytwo_p', 'bytwo_b', 'table', 'log_table', 'log_zero',
            'log_zero_ext', 'split', 'composite'];
        const len = multTypes.length;
        let count = 0;
        multTypes.forEach(multType => {
            try {
                new GF({ multType });            // eslint-disable-line no-new
            } catch (err) {
                process.stdout.write(`${err}\n`);
            }
            count++;
            if (count === len) {
                return done();
            }
            return undefined;
        });
    });

    it('divType', done => {
        const divTypes = ['default', 'matrix', 'euclid'];
        const len = divTypes.length;
        let count = 0;
        divTypes.forEach(divType => {
            try {
                new GF({ divType });            // eslint-disable-line no-new
            } catch (err) {
                process.stdout.write(`${err}\n`);
            }
            count++;
            if (count === len) {
                return done();
            }
            return undefined;
        });
    });

    it('regionType', done => {
        const regionTypes = ['default', 'double', 'quad', 'lazy', 'simd', 'sse',
            'noSimd', 'noSse', 'altmap', 'cauchy'];
        const len = regionTypes.length;
        let count = 0;
        regionTypes.forEach(regionType => {
            try {
                new GF({ regionType });            // eslint-disable-line no-new
            } catch (err) {
                process.stdout.write(`${err}\n`);
            }
            count++;
            if (count === len) {
                return done();
            }
            return undefined;
        });
    });

    it('test', () => {
        const options = {
            gfDim: 8,
            multType: 'split',
            arg1: 8,
            arg2: 4,
        };
        new GF(options);             // eslint-disable-line no-new
    });
});

describe('GF: functional tests', function cb() {
    this.timeout(0);

    before('Init Galois field', () => {
        gf = new GF({ gfDim });
    });

    it('Performance on generating GF', () => {
        const nb = 1e3;
        const start = process.hrtime();
        for (let idx = 0; idx < nb; idx++) {
            new GF({ gfDim });                  // eslint-disable-line no-new
        }
        const end = utils.getHrTime(start);
        utils.show(end / nb, 'Average time for generating GF');
    });

    it('Check multiplication & division', () => {
        for (let symbA = 1; symbA < gfCard; symbA++) {
            for (let symbB = 1; symbB < gfCard; symbB++) {
                const symbC = gf.multiply(symbA, symbB);
                if (gf.divide(symbC, symbB) !== symbA) {
                    utils.show('Inconsistently multiply and/or division' +
                        `${symbA} x ${symbB} ?= ${symbC}\n`);
                }
            }
        }
    });

    it('Check inversion', () => {
        for (let symbA = 1; symbA < gfCard; symbA++) {
            const symbB = gf.inverse(symbA);
            if (gf.multiply(symbA, symbB) !== 1) {
                utils.show(`Inconsistently inversion ${symbA}`);
            }
        }
    });

    it('Performance multiplication', () => {
        const nb = 1e5;
        let time = 0;
        for (let idx = 0; idx < nb; idx++) {
            const symbA = Math.floor(Math.random() % gfCard);
            const symbB = Math.floor(Math.random() % gfCard);
            const start = process.hrtime();
            gf.multiply(symbA, symbB);
            time += utils.getHrTime(start);
        }
        utils.show(1e3 * nb / time, 'Average multiplications OPS');
    });

    it('Performance division', () => {
        const nb = 1e5;
        let time = 0;
        // Look-up table
        for (let idx = 0; idx < nb; idx++) {
            const symbA = Math.floor(Math.random() % gfCard);
            const symbB = Math.floor(Math.random() % (gfCard - 1)) + 1;
            const start = process.hrtime();
            gf.divide(symbA, symbB);
            time += utils.getHrTime(start);
        }
        utils.show(1e3 * nb / time, 'Average division OPS');
    });
});
