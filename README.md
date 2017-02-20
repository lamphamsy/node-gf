# node-gf

This is a native Node.js module (C/C++) that wraps James S. Plank's GF-Complete
 code

GF-complete's source codes (`gf-complete` directory) are originally from
[Jerasure Library](http://lab.jerasure.org/jerasure/gf-complete)

The main target of GF-complete is to enhance the multiplication of a region
of data (buffer) and a symbol of the Galois field. We introduce APIs to
facilitate the use of `node-gf` library:

- Multiplication of a buffer with an array of symbols. Each result is
    stored or XORed to a buffer of destination array.
- Multiplication of a array of buffers with an matrix of symbols. Results are
    stored or XORed to another array of buffers.
- Same as the above case but the matrix of symbols are stored a-prior as a
    context. Only arrays of buffers are given for each operation. It is useful
    for encoding operations.

Moreover, multi-threads can be enable in such operations so that each
multiplication of a buffer with a symbol is performed in a thread.

## API

### Import library

```javascript
const NodeGF = require('node-gf');
```

### Initialization

```javascript
const gf = new NodeGF(opts);
```

where [opts] is optional parameters for generating GF-complete

- [opts.gfDim] - Galois field dimension
- [opts.multType] - multiplication type
- [opts.divType] - division type
- [opts.regionType] - multiplication region type
- [opts.primPoly] - primitive polynomial
- [opts.arg1] - argument1
- [opts.arg2] - argument2

Available types of multiplication, division, region operations are the same as
of the original GF-complete Library and shown as below.

`node-gf` | origin `GF-complete`
---|---|
Multiplication |
`default` | `GF_MULT_DEFAULT`
`shift` | `GF_MULT_SHIFT`
`carray_free` | `GF_MULT_CARRY_FREE`
`carry_free_gk` | `GF_MULT_CARRY_FREE_GK`
`group` | `GF_MULT_GROUP`
`bytwo_p` | `GF_MULT_BYTWO_p`
`table` | `GF_MULT_TABLE`
`log_table` | `GF_MULT_LOG_TABLE`
`log_zero` | `GF_MULT_LOG_ZERO`
`log_zero_ext` | `GF_MULT_LOG_ZERO_EXT`
`split` | `GF_MULT_SPLIT_TABLE`
`composite` | `GF_MULT_COMPOSITE`
|
Division |
`default` | `GF_DIVIDE_DEFAULT`
`matrix` | `GF_DIVIDE_MATRIX`
`euclid` | `GF_DIVIDE_EUCLID`
|
Region |
`default` | `GF_REGION_DEFAULT`
`double` | `GF_REGION_DOUBLE_TABLE`
`quad` | `GF_REGION_QUAD_TABLE`
`lazy` | `GF_REGION_LAZY`
`simd` | `GF_REGION_SIMD`
`sse` | `GF_REGION_SSE`
`noSimd` | `GF_REGION_NOSIMD`
`noSse` | `GF_REGION_NOSSE`
`altmap` | `GF_REGION_ALTMAP`
`cauchy` | `GF_REGION_CAUCHY`

Note that not all combinations of multiplication/division/region types are
correct. Please see
[manual](http://lab.jerasure.org/jerasure/gf-complete/tree/9f9f005a3fda204b4e4dadb6e27fc97708aa0afb/manual)
for more details.

Without specific requirements, we recommend to generate GF-complete with the
following options:

```javascript
{
    gfDim: 8,
    multType: 'split',
    divType: 'default',
    regionType: 'default',
    arg1: 4,
    arg2: 8,
}
```

### Addition

```javascript
add(num1, num2)
```

### Multiplication

```javascript
multiply(num1, num2)
```

### Division

```javascript
divide(num1, num2)
```

### Inversion

```javascript
inverse(num)
```

### Multiplication of a region with a GF symbol

```javascript
multRegion(coef, src, dest, len, flag)
```

where

- `coef`: a GF symbol
- `src`: the source buffer
- `dest`: the destination buffer
- `len`: buffer length (bytes)
- `flag`: operation flag indicating that the result: stored in `dest`
    (flag = 0) or XORed to actual `dest` (flag = 1)

### Multiplication of a region with an array of GF symbols

```javascript
multRegionArr(coefs, src, dest, destsNb, len, flag, offset)
```

For multi-thread operations:

```javascript
multRegionArrThreads(coefs, src, dest, destsNb, len, flag, offset)
```

where

- `coefs`: array of GF symbols
- `src`: the source buffer
- `dest`: the destination buffers
- `destsNb`: number of destination buffers
- `len`: buffer length (bytes)
- `flag`: operation flag indicating that the result is stored in `dest`
    (flag = 0) or XORed to actual `dest` (flag = 1)
- `offset`: offset of `dest` (bytes)

### Multiplication of an array of regions with a matrix of GF symbols

```javascript
multRegionMatrix(coefs, rowsNb, colsNb, src, dest, len, offset)
```

For multi-thread operations:

```javascript
multRegionMatrixThreads(coefs, rowsNb, colsNb, src, dest, len, offset)
```

where

- `coefs`: array of `rowsNb x colsNb` GF symbols
- `rowsNb`: number of input regions
- `colsNb`: number of output regions
- `src`: the source buffers
- `dest`: the destination buffers
- `len`: buffer length (bytes)
- `offset`: offset of `dest` (bytes)

### Multiplication of an array of regions with a given context

```javascript
multRegionMatrixContext(contextId, src, dest, len, offset)
```

For multi-thread operations:

```javascript
multRegionMatrixThreadsContext(contextId, src, dest, len, offset)
```

where

- `contextId`: identity of a context
- `src`: the source buffers
- `dest`: the destination buffers
- `len`: buffer length (bytes) (optional)
- `offset`: offset of `dest` (bytes) (optional)

A context identity is return from

```javascript
initContext(coefs, rowsNb, colsNb, len)
```

where

- `coefs`: array of `rowsNb x colsNb` GF symbols
- `rowsNb`: number of input regions
- `colsNb`: number of output regions
- `len`: buffer length (bytes)

A context is deleted by

```javascript
removeContext(contextId)
```

where

- `contextId`: identity of a context
