'use strict';                                   // eslint-disable-line strict

/** @file
 * This module create a Galois field
 */

const gf = require('../build/Release/gf.node');
const opTypes = require('./opTypes');
const errors = require('./errors');
/**
 * Get multiplication type
 * @param {String} _type - multiplication type
 * @return {String} multType - multiplication type
 */
function getMultType(_type) {
    let multType;
    const type = _type || 'split';
    if (type === 'default') {
        multType = opTypes.multiplication.GF_MULT_DEFAULT;
    } else if (type === 'shift') {
        multType = opTypes.multiplication.GF_MULT_SHIFT;
    } else if (type === 'carry_free') {
        multType = opTypes.multiplication.GF_MULT_CARRY_FREE;
    } else if (type === 'carry_free_gk') {
        multType = opTypes.multiplication.GF_MULT_CARRY_FREE_GK;
    } else if (type === 'group') {
        multType = opTypes.multiplication.GF_MULT_GROUP;
    } else if (type === 'bytwo_p') {
        multType = opTypes.multiplication.GF_MULT_BYTWO_p;
    } else if (type === 'bytwo_b') {
        multType = opTypes.multiplication.GF_MULT_BYTWO_b;
    } else if (type === 'table') {
        multType = opTypes.multiplication.GF_MULT_TABLE;
    } else if (type === 'log_table') {
        multType = opTypes.multiplication.GF_MULT_LOG_TABLE;
    } else if (type === 'log_zero') {
        multType = opTypes.multiplication.GF_MULT_LOG_ZERO;
    } else if (type === 'log_zero_ext') {
        multType = opTypes.multiplication.GF_MULT_LOG_ZERO_EXT;
    } else if (type === 'split') {
        multType = opTypes.multiplication.GF_MULT_SPLIT_TABLE;
    } else if (type === 'composite') {
        multType = opTypes.multiplication.GF_MULT_COMPOSITE;
    } else {
        throw Error(`Unknown multiplication type (${type})`);
    }
    return multType;
}

/**
 * Get division type
 * @param {String} _type - division type
 * @return {String} divType - division type
 */
function getDivType(_type) {
    let divType;
    const type = _type || 'default';
    if (type === 'default') {
        divType = opTypes.division.GF_DIVIDE_DEFAULT;
    } else if (type === 'matrix') {
        divType = opTypes.division.GF_DIVIDE_MATRIX;
    } else if (type === 'euclid') {
        divType = opTypes.division.GF_DIVIDE_EUCLID;
    } else {
        throw Error(`Unknown division type (${type})`);
    }
    return divType;
}

/**
 * Get multiplication region type
 * @param {String} _type - multiplication region type
 * @return {String} regionType - multiplication region type
 */
function getRegionType(_type) {
    let regionType;
    const type = _type || 'default';
    if (type === 'default') {
        regionType = opTypes.region.GF_REGION_DEFAULT;
    } else if (type === 'double') {
        regionType = opTypes.region.GF_REGION_DOUBLE_TABLE;
    } else if (type === 'quad') {
        regionType = opTypes.region.GF_REGION_QUAD_TABLE;
    } else if (type === 'lazy') {
        regionType = opTypes.region.GF_REGION_LAZY;
    } else if (type === 'simd') {
        regionType = opTypes.region.GF_REGION_SIMD;
    } else if (type === 'sse') {
        regionType = opTypes.region.GF_REGION_SSE;
    } else if (type === 'noSimd') {
        regionType = opTypes.region.GF_REGION_NOSIMD;
    } else if (type === 'noSse') {
        regionType = opTypes.region.GF_REGION_NOSSE;
    } else if (type === 'altmap') {
        regionType = opTypes.region.GF_REGION_ALTMAP;
    } else if (type === 'cauchy') {
        regionType = opTypes.region.GF_REGION_CAUCHY;
    } else {
        throw Error(`Unknown multiplication region type (${type})`);
    }
    return regionType;
}

/* List of constructed GFs*/
const gfList = {};

class GF {
    /**
     * @constructor
     * @param {Object} [opts] - optional parameters
     * @param {Number} [opts.gfDim] - Galois field dimension
     * @param {String} [opts.multType] - multiplication type
     * @param {String} [opts.divType] - division type
     * @param {String} [opts.regionType] - multiplication region type
     * @param {Number} [opts.primPoly] - primitive polynomial
     * @param {Number} [opts.arg1] - argument1
     * @param {Number} [opts.arg2] - argument2
     * @param {Number} [opts.forceCreate] - option to force create GF
     * FORCE create
     */
    constructor(opts) {
        const options = opts || {};

        const gfDim = options.gfDim || 8;
        const multType = getMultType(options.multType);
        const divType = getDivType(options.divType);
        const regionType = getRegionType(options.regionType);
        const primPoly = options.primPoly || 0;
        let arg1 = options.arg1;
        let arg2 = options.arg2;
        if (multType === opTypes.multiplication.GF_MULT_SPLIT_TABLE) {
            if (!arg1) {
                arg1 = 4;
            }
            if (!arg2) {
                arg2 = gfDim;
            }
        }
        const params = [multType, divType, regionType, primPoly, arg1, arg2];
        if (!options.forceCreate && gfList[params] !== undefined) {
            this.gfIndex = gfList[params];
        } else {
            this.gfIndex = gf.init(gfDim, multType, regionType, divType,
                primPoly, arg1, arg2);
            if (this.gfIndex < 0) {
                const msg = errors(this.gfIndex);
                throw Error(`Failed to create Galois field: ${msg}`);
            }
            gfList[params] = this.gfIndex;
        }

        this.gfDim = gfDim;
        this.gfCard = Math.pow(2, gfDim);
    }

    /**
     * Addition
     * @param {Number} num1 - a number
     * @param {Number} num2 - a number
     * @return {Number} num - result
     */
    add(num1, num2) {
        return gf.add(num1, num2, this.gfIndex);
    }

    /**
     * Multiplication
     * @param {Number} num1 - a number
     * @param {Number} num2 - a number
     * @return {Number} num - result
     */
    multiply(num1, num2) {
        return gf.multiply(num1, num2, this.gfIndex);
    }

    /**
     * Division
     * @param {Number} num1 - a number
     * @param {Number} num2 - a number
     * @return {Number} num - result
     */
    divide(num1, num2) {
        return gf.divide(num1, num2, this.gfIndex);
    }

    /**
     * Inversion
     * @param {Number} num - a number
     * @return {Number} num - result
     */
    inverse(num) {
        return gf.inverse(num, this.gfIndex);
    }

    /**
     * Region multiplication
     * @param {Number} coef - a number
     * @param {Buffer} src - source buffer
     * @param {Buffer} dest - destination buffer
     * @param {Number} len - buffer length
     * @param {Number} flag - operation flag indicating region multiplication
     *  is stored in `dest` (flag = 0) or XORed to actual `dest` (flag = 1)
     * @return {undefined}
     */
    multRegion(coef, src, dest, len, flag) {
        gf.multRegion(coef, src, dest, len, flag, this.gfIndex);
    }

    /**
     * Region multiplication on an array of buffers
     * @param {Numbers} coefs - array of coefficients
     * @param {Buffer} src - source buffer
     * @param {Buffer[]} dest - destination buffers
     * @param {Number} destsNb - number of buffers
     * @param {Number} len - buffer length
     * @param {Number} flag - operation flag indicating retion multiplication
     *  is stored in `dest` (flag = 0) or XORed to actual `dest` (flag = 1)
     * @param {Number} offset - offset of `dest`
     * @return {undefined}
     */
    multRegionArr(coefs, src, dest, destsNb, len, flag, offset) {
        gf.multRegionArr(coefs, src, dest, destsNb, len, flag, offset,
            this.gfIndex);
    }

    /**
     * Multiplication a region by a matrix
     * @param {Numbers} coefs - matrix of coefficients
     * @param {Number} rowsNb - number of rows
     * @param {Number} colsNb - number of columns
     * @param {Buffer} src - source buffer
     * @param {Buffer[]} dest - destination buffers
     * @param {Number} len - chunk size
     * @param {Number} offset - offset of `dest`
     * @return {undefined}
     */
    multRegionMatrix(coefs, rowsNb, colsNb, src, dest, len, offset) {
        gf.multRegionMatrix(coefs, rowsNb, colsNb, src, dest, len, offset,
            this.gfIndex);
    }

    /**
     * Region multiplication on an array of buffers with multi-threads
     * @param {Numbers} coefs - array of coefficients
     * @param {Buffer} src - source buffer
     * @param {Buffer[]} dest - destination buffers
     * @param {Number} destsNb - number of buffers
     * @param {Number} len - buffer length
     * @param {Number} flag - operation flag indicating retion multiplication
     *  is stored in `dest` (flag = 0) or XORed to actual `dest` (flag = 1)
     * @param {Number} offset - offset of `dest`
     * @return {undefined}
     */
    multRegionArrThreads(coefs, src, dest, destsNb, len, flag, offset) {
        gf.multRegionArrThreads(coefs, src, dest, destsNb, len, flag, offset,
            this.gfIndex);
    }

    /**
     * Multiplication a region by a matrix
     * @param {Numbers} coefs - matrix of coefficients
     * @param {Number} rowsNb - number of rows
     * @param {Number} colsNb - number of columns
     * @param {Buffer} src - source buffer
     * @param {Buffer[]} dest - destination buffers
     * @param {Number} len - chunk size
     * @param {Number} offset - offset of `dest`
     * @return {undefined}
     */
    multRegionMatrixThreads(coefs, rowsNb, colsNb, src, dest, len, offset) {
        gf.multRegionMatrixThreads(coefs, rowsNb, colsNb, src, dest, len,
            offset, this.gfIndex);
    }

    /**
     * Multiplication a region by a matrix with context
     * @param {Number} contextId - context id
     * @param {Buffer} src - source buffer
     * @param {Buffer[]} dest - destination buffers
     * @param {Number} [len] - chunk size
     * @param {Number} [offset] - offset of `dest`
     * @return {undefined}
     */
    multRegionMatrixContext(contextId, src, dest, len, offset) {
        gf.multRegionMatrixContext(contextId, src, dest, len, offset);
    }

    /**
     * Multiplication a region by a matrix
     * @param {Number} contextId - context id
     * @param {Buffer} src - source buffer
     * @param {Buffer[]} dest - destination buffers
     * @param {Number} [len] - chunk size
     * @param {Number} [offset] - offset of `dest`
     * @return {undefined}
     */
    multRegionMatrixThreadsContext(contextId, src, dest, len, offset) {
        gf.multRegionMatrixThreadsContext(contextId, src, dest, len, offset);
    }

    /**
     * Create a context
     * @param {Numbers} coefs - matrix of coefficients
     * @param {Number} rowsNb - number of rows
     * @param {Number} colsNb - number of columns
     * @param {Number} len - chunk size
     * @return {Number} context id
     */
    initContext(coefs, rowsNb, colsNb, len) {
        return gf.initContext(coefs, rowsNb, colsNb, len, this.gfIndex);
    }

    /**
     * Remove a context
     * @param {Number} contextId - context id
     * @return {undefined}
     */
    removeContext(contextId) {
        return gf.removeContext(contextId);
    }
}

module.exports = GF;
