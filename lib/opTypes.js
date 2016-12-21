
/*
 * Operation options are extracted from GF-complete library
 */


/* These are the different ways to perform multiplication.
   Not all are implemented for all values of w.
   See the paper for an explanation of how they work. */
const multiplication = {
    GF_MULT_DEFAULT: 0,
    GF_MULT_SHIFT: 1,
    GF_MULT_CARRY_FREE: 2,
    GF_MULT_CARRY_FREE_GK: 3,
    GF_MULT_GROUP: 4,
    GF_MULT_BYTWO_p: 5,                                 // eslint-disable-line
    GF_MULT_BYTWO_b: 6,                                 // eslint-disable-line
    GF_MULT_TABLE: 7,
    GF_MULT_LOG_TABLE: 8,
    GF_MULT_LOG_ZERO: 9,
    GF_MULT_LOG_ZERO_EXT: 10,
    GF_MULT_SPLIT_TABLE: 11,
    GF_MULT_COMPOSITE: 12,
};

/* These are the different ways to optimize region
   operations.  They are bits because you can compose them.
   Certain optimizations only apply to certain gf_mult_type_t's.
   Again, please see documentation for how to use these */
const region = {
    GF_REGION_DEFAULT: 0x0,
    GF_REGION_DOUBLE_TABLE: 0x1,
    GF_REGION_QUAD_TABLE: 0x2,
    GF_REGION_LAZY: 0x4,
    GF_REGION_SIMD: 0x8,
    GF_REGION_SSE: 0x8,
    GF_REGION_NOSIMD: 0x10,
    GF_REGION_NOSSE: 0x10,
    GF_REGION_ALTMAP: 0x20,
    GF_REGION_CAUCHY: 0x40,
};

/* These are different ways to implement division.
   Once again, it's best to use "DEFAULT".  However,
   there are times when you may want to experiment
   with the others. */
const division = {
    GF_DIVIDE_DEFAULT: 0,
    GF_DIVIDE_MATRIX: 1,
    GF_DIVIDE_EUCLID: 2,
};

module.exports = {
    multiplication,
    division,
    region,
};
