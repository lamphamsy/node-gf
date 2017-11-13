/*
 * Copyright (C) 2016 Scality
 *
 */

#include <nan.h>
#include <sys/types.h>
#include <sys/time.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>
#include <vector>

extern "C" {
#include "gf_complete.h"
#include "gf_general.h"
#include "gf_rand.h"
}

typedef struct context_stripe {
    gf_general_t *coefsArr;
    uint32_t rowsNb;
    uint32_t colsNb;
    uint32_t coefsNb;
    uint32_t len;
    int gfIndex;
} context_t;

static std::vector<gf_t> gfList;

static std::vector<context_t*> contextList;
static std::vector<uint32_t> freedContext;

#define SHOW_TIME   0

/* Default wDefault */
uint32_t wDefault = 8;

void timer_start (double *t) {
    struct timeval  tv;

    gettimeofday (&tv, NULL);
    *t = (double)tv.tv_sec + (double)tv.tv_usec * 1e-6;
}

double timer_split (const double *t) {
    struct timeval  tv;
    double  cur_t;

    gettimeofday (&tv, NULL);
    cur_t = (double)tv.tv_sec + (double)tv.tv_usec * 1e-6;
    return (cur_t - *t);
}

/*
 * Initializes the GF changing the defaults.
    Returns 0 on failure, 1 on success.
    Pass it a pointer to a gf_t.
    For mult_type and divide_type, use one of gf_mult_type_t gf_divide_type_t .
    For region_type, OR together the GF_REGION_xxx's defined above.
    Use 0 as prim_poly for defaults.  Otherwise, the leading 1 is optional.
    Use NULL for scratch_memory to have init_hard allocate memory.  Otherwise,
    use gf_scratch_size() to determine how big scratch_memory has to be.
 */
NAN_METHOD(init) {
    Nan::HandleScope scope;

    /* Order of potential arguments
    int w,
    int mult_type,
    int region_type,
    int divide_type,
    uint64_t prim_poly,
    int arg1,
    int arg2,
    GFP base_gf,
    void *scratch_memory);
    */
    uint32_t w = wDefault;
    int mult_type = GF_MULT_SPLIT_TABLE;
    int region_type = GF_REGION_DEFAULT;
    int divide_type = GF_DIVIDE_DEFAULT;
    int64_t prim_poly = 0;
    int arg1 = w;
    int arg2 = 4;
    GFP base_gf = NULL;
    gf_t gf;

    int gfIndex;

    if (info.Length() > 0) {
        w = Nan::To<uint32_t>(info[0]).FromJust();
    }
    if (info.Length() > 1) {
        mult_type = Nan::To<int>(info[1]).FromJust();
    }
    if (info.Length() > 2) {
        region_type = Nan::To<int>(info[2]).FromJust();
    }
    if (info.Length() > 3) {
        divide_type = Nan::To<int>(info[3]).FromJust();
    }
    if (info.Length() > 4) {
        prim_poly = Nan::To<int64_t>(info[4]).FromJust();
    }
    if (info.Length() > 5) {
        arg1 = Nan::To<int>(info[5]).FromJust();
    }
    if (info.Length() > 6) {
        arg2 = Nan::To<int>(info[6]).FromJust();
    }
    int status = gf_init_hard(&gf, w, mult_type, region_type, divide_type,
        prim_poly, arg1, arg2, base_gf, NULL);
    if (status < 1) {   // init got error
        gfIndex = -_gf_errno;   // return error code
    } else {
        gfList.push_back(gf);
        gfIndex = gfList.size() - 1;
    }
    info.GetReturnValue().Set(Nan::New(gfIndex));

}

/* NOTE: Support only for w <= 32 */
NAN_METHOD(add) {
    Nan::HandleScope scope;

    if (info.Length() != 2 && info.Length() != 3) {
        Nan::ThrowTypeError("Wrong number of arguments for ADD");
        return ;
    }

    gf_general_t a, b, c;
    int gfIndex = 0;

    a.w32 = Nan::To<int>(info[0]).FromJust();
    b.w32 = Nan::To<int>(info[1]).FromJust();
    if (info.Length() == 3) {
        gfIndex = Nan::To<int>(info[2]).FromJust();
    }

    gf_general_add(&gfList[gfIndex], &a, &b, &c);
    info.GetReturnValue().Set(Nan::New(c.w32));
}

/* NOTE: Support only for w <= 32 */
NAN_METHOD(multiply) {
    Nan::HandleScope scope;

    if (info.Length() != 2 && info.Length() != 3) {
        Nan::ThrowTypeError("Wrong number of arguments for MULTIPLY");
        return ;
    }

    gf_general_t a, b, c;
    int gfIndex = 0;

    a.w32 = Nan::To<int>(info[0]).FromJust();
    b.w32 = Nan::To<int>(info[1]).FromJust();
    if (info.Length() == 3) {
        gfIndex = Nan::To<int>(info[2]).FromJust();
    }

    gf_general_multiply(&gfList[gfIndex], &a, &b, &c);
    info.GetReturnValue().Set(Nan::New(c.w32));
}

/* NOTE: Support only for w <= 32 */
NAN_METHOD(divide) {
    Nan::HandleScope scope;

    if (info.Length() != 2 && info.Length() != 3) {
        Nan::ThrowTypeError("Wrong number of arguments for DIVIDE");
        return ;
    }

    gf_general_t a, b, c;
    int gfIndex = 0;

    a.w32 = Nan::To<int>(info[0]).FromJust();
    b.w32 = Nan::To<int>(info[1]).FromJust();
    if (info.Length() == 3) {
        gfIndex = Nan::To<int>(info[2]).FromJust();
    }

    gf_general_divide(&gfList[gfIndex], &a, &b, &c);
    info.GetReturnValue().Set(Nan::New(c.w32));
}

/* NOTE: Support only for w <= 32 */
NAN_METHOD(inverse) {
    Nan::HandleScope scope;

    if (info.Length() != 1 && info.Length() != 2) {
        Nan::ThrowTypeError("Wrong number of arguments for INVERSE");
        return ;
    }

    gf_general_t a, b;
    int gfIndex = 0;

    a.w32 = Nan::To<int>(info[0]).FromJust();
    if (info.Length() == 2) {
        gfIndex = Nan::To<int>(info[1]).FromJust();
    }

    gf_general_inverse(&gfList[gfIndex], &a, &b);
    info.GetReturnValue().Set(Nan::New(b.w32));
}

/*
 * Perform a multiplication of a region with a constant.
 *  Result is either saved or xored to the destination
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(multRegion) {
    Nan::HandleScope scope;

    uint32_t info_length = info.Length();
    /* Order of potential arguments
       uint32_t coef,
       char *src,
       char *dest,
       int len,
       int xor
       int gfIndex
    */
    if (info_length != 5 && info_length != 6) {
        Nan::ThrowTypeError("Wrong number of arguments for multRegion");
        return ;
    }
#if SHOW_TIME
    double timer, init_time, process_time;
    timer_start(&timer);
#endif
    gf_general_t a;
    a.w32 = Nan::To<int>(info[0]).FromJust();
    char *src = node::Buffer::Data(info[1]);
    char *dest = node::Buffer::Data(info[2]);
    uint32_t len = Nan::To<uint32_t>(info[3]).FromJust();
    int xorFlag = Nan::To<int>(info[4]).FromJust();
    int gfIndex = 0;
    if (info_length == 6) {
        gfIndex = Nan::To<int>(info[5]).FromJust();
    }
#if SHOW_TIME
    init_time = timer_split(&timer);
    timer_start(&timer);
#endif
    gf_general_do_region_multiply(&gfList[gfIndex], &a, src, dest, len,
        xorFlag);
#if SHOW_TIME
    process_time = timer_split(&timer);
    float size = len/1024.0/1024.0;
    printf("multRegion: init %.3es process %.3es  MB: %10.3lf     \
        %10.3lf MB/s vs. %10.3lf MB/s\n",
        init_time, process_time,
        size, size/(process_time), size/(process_time + init_time));
#endif
}

/*
 * Perform a multiplication of a region with a set of constants.
 *  Results are either saved or xored to a set of destinations.
 *  [coef_0, ..., coef_n] * src = [dest_0, ..., dest_n]
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(multRegionArr) {
    Nan::HandleScope scope;

    uint32_t info_length = info.Length();
    /* Order of potential arguments
    int *coefs,
    char *src,
    char **dest,
    int destsNb,
    int len,
    int xor
    uint32_t offset,
    int gfIndex
    */
    if (info_length < 6) {
        Nan::ThrowTypeError("Wrong number of arguments for multRegionArr");
        return ;
    }
#if SHOW_TIME
    double timer, init_time, process_time;
    timer_start(&timer);
#endif

    v8::Local<v8::Object> coefs =
        Nan::To<v8::Object>(info[0]).ToLocalChecked();
    char *src = node::Buffer::Data(info[1]);
    v8::Local<v8::Object> destsObj =
        Nan::To<v8::Object>(info[2]).ToLocalChecked();
    uint32_t destsNb = Nan::To<uint32_t>(info[3]).FromJust();
    uint32_t len = Nan::To<uint32_t>(info[4]).FromJust();
    int xorFlag = Nan::To<int>(info[5]).FromJust();
    // offset at each destination
    uint32_t offset = 0;
    if (info_length > 6) {
        offset = Nan::To<uint32_t>(info[6]).FromJust();
    }
    int gfIndex = 0;
    if (info_length > 7) {
        gfIndex = Nan::To<int>(info[7]).FromJust();
    }

    uint32_t i;
    char **dest = new char*[destsNb];
    gf_general_t *coefsArr = new gf_general_t[destsNb];
#if SHOW_TIME
    init_time = timer_split(&timer);
    timer_start(&timer);
#endif
    for (i = 0; i < destsNb; i++) {
        coefsArr[i].w32 = Nan::To<uint32_t>(Nan::Get(coefs, i).
            ToLocalChecked()).FromJust();
        dest[i] = node::Buffer::Data(Nan::Get(destsObj, i).ToLocalChecked());
        gf_general_do_region_multiply(&gfList[gfIndex], &coefsArr[i], src,
            dest[i] + offset, len, xorFlag);
    }
    delete[] dest;
    delete[] coefsArr;

#if SHOW_TIME
    process_time = timer_split(&timer);
    float size = len/1024.0/1024.0;
    printf("multRegionArr: init %.3es process %.3es  MB: %10.3lf    \
        %10.3lf MB/s vs. %10.3lf MB/s\n",
        init_time, process_time,
        size, size/(process_time), size/(process_time + init_time));
#endif
}

/*
 * Perform a multiplication of a region with a matrix of constants.
 *  Each result are saved to a set of destinations.
 *  Matrix_r_c x [src_0, src_1, ..., src_c]^(t) = [dest_0, ..., dest_r]^(t)
 *  Matrix_r_c is a [r x c] matrix
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(multRegionMatrix) {
    Nan::HandleScope scope;

    uint32_t info_length = info.Length();
    /* Order of potential arguments
    int *coefs,
    uint32_t rowsNb,
    uint32_t colsNb,
    char *src,
    char *dest,
    uint32_t len,
    uint32_t offset,
    int gfIndex
    */
    if (info_length < 6) {
        Nan::ThrowTypeError("Wrong number of arguments for multRegionMatrix");
        return ;
    }
#if SHOW_TIME
    double timer, init_time, process_time;
    timer_start(&timer);
#endif

    v8::Local<v8::Object> coefs =
        Nan::To<v8::Object>(info[0]).ToLocalChecked();
    uint32_t rowsNb = Nan::To<uint32_t>(info[1]).FromJust();
    uint32_t colsNb = Nan::To<uint32_t>(info[2]).FromJust();
    // data chunks
    char *src = node::Buffer::Data(info[3]);
    // parity chunks
    char *dest = node::Buffer::Data(info[4]);
    // chunk length
    uint32_t len = Nan::To<uint32_t>(info[5]).FromJust();
    // offset of parity
    if (info_length > 6) {
        uint32_t offset = Nan::To<uint32_t>(info[6]).FromJust();
        dest += offset;
    }
    int gfIndex = 0;
    if (info_length > 7) {
        gfIndex = Nan::To<int>(info[7]).FromJust();
    }

    char *_dest = dest;
    char *_src = src;
    // read coefs
    uint32_t coefsNb = rowsNb * colsNb;
    uint32_t i, j, idx;
    gf_general_t *coefsArr = new gf_general_t[coefsNb];
    for (i = 0; i < coefsNb; i++) {
        coefsArr[i].w32 = Nan::To<uint32_t>(Nan::Get(coefs, i).
            ToLocalChecked()).FromJust();
    }
#if SHOW_TIME
    init_time = timer_split(&timer);
    timer_start(&timer);
#endif
    idx = 0;
    for (i = 0; i < rowsNb; i++) {
        _src = src;
        gf_general_do_region_multiply(&gfList[gfIndex], &coefsArr[idx++],
            _src, _dest, len, 0);
        _src += len;
        for (j = 1; j < colsNb; j++) {
            gf_general_do_region_multiply(&gfList[gfIndex], &coefsArr[idx++],
                _src, _dest, len, 1);
            _src += len;
        }
        _dest += len;
    }
    delete[] coefsArr;

#if SHOW_TIME
    process_time = timer_split(&timer);
    float size = colsNb*len/1024.0/1024.0;
    printf("multRegionMatrix: init %.3es process %.3es  MB: %10.3lf    \
        %10.3lf MB/s vs. %10.3lf MB/s\n",
        init_time, process_time,
        size, size/(process_time), size/(process_time + init_time));
#endif
}

/*
 * Perform a multiplication of a region with a matrix of constants.
 *  Result are saved to a set of destinations.
 *  Matrix_r_c x [src_0, src_1, ..., src_c]^(t) = [dest_0, ..., dest_r]^(t)
 *  Matrix_r_c is a [r x c] matrix
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(multRegionMatrixContext) {
    Nan::HandleScope scope;

    uint32_t info_length = info.Length();
    /* Order of potential arguments
        uint32_t contextId,
        char *src,
        char *dest,
        uint32_t len,
        uint32_t offset,
    */
    if (info_length < 3) {
        Nan::ThrowTypeError(
            "Wrong number of arguments for multRegionMatrixContext");
        return ;
    }
#if SHOW_TIME
    double timer, init_time, process_time;
    timer_start(&timer);
#endif
    uint32_t contextId = Nan::To<uint32_t>(info[0]).FromJust();
    context_t *context = contextList[contextId];
    // data chunks
    char *src = node::Buffer::Data(info[1]);
    // parity chunks
    char *dest = node::Buffer::Data(info[2]);
    uint32_t len = context->len;
    if (info_length > 3) {
        len = Nan::To<uint32_t>(info[3]).FromJust();
    }
    // offset of parity
    if (info_length > 4) {
        uint32_t offset = Nan::To<uint32_t>(info[4]).FromJust();
        dest += offset;
    }
#if SHOW_TIME
    init_time = timer_split(&timer);
    timer_start(&timer);
#endif
    char *_dest = dest;
    char *_src = src;
    uint32_t i, j, idx;
    idx = 0;
    for (i = 0; i < context->rowsNb; i++) {
        _src = src;
        gf_general_do_region_multiply(&gfList[context->gfIndex],
            &context->coefsArr[idx++], _src, _dest, len, 0);
        _src += len;
        for (j = 1; j < context->colsNb; j++) {
            gf_general_do_region_multiply(&gfList[context->gfIndex],
                &context->coefsArr[idx++], _src, _dest, len, 1);
            _src += len;
        }
        _dest += len;
    }
#if SHOW_TIME
    process_time = timer_split(&timer);
    float size = context->colsNb*len/1024.0/1024.0;
    printf("multRegionMatrixContext: init %.3es process %.3es  MB: %10.3lf    \
        %10.3lf MB/s vs. %10.3lf MB/s\n",
        init_time, process_time,
        size, size/(process_time), size/(process_time + init_time));
#endif
}

typedef struct thread_data{
    int threadId;
    gf_general_t *a;
    char *src;
    char *dest;
    int len;
    int xorFlag;
    int gfIndex;
} thread_args;

void *doMultRegion(void *threadarg) {
    thread_args *my_data;
    my_data = (thread_args*) threadarg;
    gf_general_do_region_multiply(&gfList[my_data->gfIndex], my_data->a,
        my_data->src, my_data->dest, my_data->len, my_data->xorFlag);
    pthread_exit((void*)my_data->threadId);
}

/*
 * Perform a multiplication of a region with a set of constants each is
 *  executed in a thread.
 *  Results are either saved or xored to a set of destinations.
 *  [coef_0, ..., coef_n] * src = [dest_0, ..., dest_n]
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(multRegionArrThreads) {
    Nan::HandleScope scope;

    uint32_t info_length = info.Length();
    /* Order of potential arguments
    int *coefs,
    char *src,
    char **dest,
    int destsNb,
    int len,
    int xor
    uint32_t offset,
    int gfIndex
    */
    if (info_length < 6) {
        Nan::ThrowTypeError(
            "Wrong number of arguments for multRegionArrThreads");
        return ;
    }
#if SHOW_TIME
    double timer, init_time, process_time;
    timer_start(&timer);
#endif

    v8::Local<v8::Object> coefs =
        Nan::To<v8::Object>(info[0]).ToLocalChecked();
    char *src = node::Buffer::Data(info[1]);
    v8::Local<v8::Object> destsObj =
        Nan::To<v8::Object>(info[2]).ToLocalChecked();
    uint32_t destsNb = Nan::To<uint32_t>(info[3]).FromJust();
    uint32_t len = Nan::To<uint32_t>(info[4]).FromJust();
    int xorFlag = Nan::To<int>(info[5]).FromJust();
    uint32_t offset = 0;
    if (info_length > 6) {
        offset = Nan::To<uint32_t>(info[6]).FromJust();
    }
    int gfIndex = 0;
    if (info_length > 7) {
        gfIndex = Nan::To<int>(info[7]).FromJust();
    }

    pthread_t threads[destsNb];
    thread_args thread_data[destsNb];
    pthread_attr_t attr;
    int rc;
    void *status;
    uint32_t t;
    char **dest = new char*[destsNb];
    gf_general_t *coefsArr = new gf_general_t[destsNb];

    /* Initialize and set thread detached attribute */
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_JOINABLE);
#if SHOW_TIME
    init_time = timer_split(&timer);
    timer_start(&timer);
#endif
    for (t = 0; t < destsNb; t++) {
        coefsArr[t].w32 = Nan::To<uint32_t>(Nan::Get(coefs, t).
            ToLocalChecked()).FromJust();
        dest[t] = node::Buffer::Data(Nan::Get(destsObj, t).ToLocalChecked());
        thread_data[t].threadId = t;
        thread_data[t].a = &coefsArr[t];
        thread_data[t].src = src;
        thread_data[t].dest = dest[t] + offset;
        thread_data[t].len = len;
        thread_data[t].xorFlag = xorFlag;
        thread_data[t].gfIndex = gfIndex;

        rc = pthread_create(&threads[t], &attr, doMultRegion,
            (void *)&thread_data[t]);
    }

    /* Free attribute and wait for the other threads */
    pthread_attr_destroy(&attr);
    for(t = 0; t < destsNb; t++) {
        rc = pthread_join(threads[t], &status);
        if (rc) {
           printf("ERROR; return code from pthread_join() is %d\n", rc);
           exit(-1);
        }
    }
    delete[] dest;
    delete[] coefsArr;

#if SHOW_TIME
    process_time = timer_split(&timer);
    float size = len/1024.0/1024.0;
    printf("multRegionArrThreads: init %.3es process %.3es  MB: %10.3lf    \
        %10.3lf MB/s vs. %10.3lf MB/s\n",
        init_time, process_time,
        size, size/(process_time), size/(process_time + init_time));
#endif
    // pthread_exit(NULL);
}

typedef struct thread_data_matrix{
    int threadId;
    gf_general_t *coefsArr;
    char *src;
    char *dest;
    int len;
    uint32_t colsNb;
    int gfIndex;
} thread_matrix_args;

void *doMultRegionMatrix(void *threadarg) {
    thread_matrix_args *my_data;
    my_data = (thread_matrix_args*) threadarg;

    uint32_t j = 0;
    char *_src = my_data->src;

    gf_general_do_region_multiply(&gfList[my_data->gfIndex],
        &my_data->coefsArr[j], _src, my_data->dest, my_data->len, 0);
    _src += my_data->len;

    for (j = 1; j < my_data->colsNb; j++) {
        gf_general_do_region_multiply(&gfList[my_data->gfIndex],
            &my_data->coefsArr[j], _src, my_data->dest, my_data->len, 1);
        _src += my_data->len;
    }

    pthread_exit((void*)my_data->threadId);
}

/*
 * Perform a multiplication of a region with a matrix of constants.
 *  Multiplication for a destination is performed in a thread.
 *  Result are saved to a set of destinations.
 *  Matrix_r_c x [src_0, src_1, ..., src_c]^(t) = [dest_0, ..., dest_r]^(t)
 *  Matrix_r_c is a [r x c] matrix
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(multRegionMatrixThreads) {
    Nan::HandleScope scope;

    uint32_t info_length = info.Length();
    if (info_length < 6) {
        Nan::ThrowTypeError("Wrong number of arguments for multRegion");
        return ;
    }
#if SHOW_TIME
    double timer, init_time, process_time;
    timer_start(&timer);
#endif
    v8::Local<v8::Object> coefs =
        Nan::To<v8::Object>(info[0]).ToLocalChecked();
    uint32_t rowsNb = Nan::To<uint32_t>(info[1]).FromJust();
    uint32_t colsNb = Nan::To<uint32_t>(info[2]).FromJust();
    // data chunks
    char *src = node::Buffer::Data(info[3]);
    // parity chunks
    char *dest = node::Buffer::Data(info[4]);
    // chunk length
    uint32_t len = Nan::To<uint32_t>(info[5]).FromJust();
    // offset of parity
    if (info_length > 6) {
        uint32_t offset = Nan::To<uint32_t>(info[6]).FromJust();
        dest += offset;
    }
    int gfIndex = 0;
    if (info_length > 7) {
        gfIndex = Nan::To<int>(info[7]).FromJust();
    }

    pthread_t threads[rowsNb];
    thread_matrix_args thread_data[rowsNb];
    pthread_attr_t attr;
    void *status;
    int rc;

    char *_dest = dest;
    // read coefs
    uint32_t coefsNb = rowsNb * colsNb;
    uint32_t i;
    gf_general_t *coefsArr = new gf_general_t[coefsNb];
    for (i = 0; i < coefsNb; i++) {
        coefsArr[i].w32 = Nan::To<uint32_t>(Nan::Get(coefs, i).
            ToLocalChecked()).FromJust();
    }

    /* Initialize and set thread detached attribute */
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_JOINABLE);

#if SHOW_TIME
    init_time = timer_split(&timer);
    timer_start(&timer);
#endif
    for (i = 0; i < rowsNb; i++) {
        thread_data[i].threadId = i;
        thread_data[i].coefsArr = coefsArr + i * colsNb;
        thread_data[i].src = src;
        thread_data[i].dest = _dest;
        thread_data[i].len = len;
        thread_data[i].colsNb = colsNb;
        thread_data[i].gfIndex = gfIndex;

        rc = pthread_create(&threads[i], &attr, doMultRegionMatrix,
            (void *)&thread_data[i]);
        _dest += len;
    }
    /* Free attribute and wait for the other threads */
    pthread_attr_destroy(&attr);
    for (i = 0; i < rowsNb; i++) {
        rc = pthread_join(threads[i], &status);
        if (rc) {
           printf("ERROR; return code from pthread_join() is %d\n", rc);
           exit(-1);
        }
    }
    delete[] coefsArr;

#if SHOW_TIME
    process_time = timer_split(&timer);
    float size = colsNb*len/1024.0/1024.0;
    printf("multRegionMatrixThreads: init %.3es process %.3es  MB: %10.3lf \
        %10.3lf MB/s vs. %10.3lf MB/s\n",
        init_time, process_time,
        size, size/(process_time), size/(process_time + init_time));
#endif
}

/*
 * Perform a multiplication of a region with a matrix of constants.
 *  Multiplication for a destination is performed in a thread.
 *  Result are saved to a set of destinations.
 *  Matrix_r_c x [src_0, src_1, ..., src_c]^(t) = [dest_0, ..., dest_r]^(t)
 *  Matrix_r_c is a [r x c] matrix
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(multRegionMatrixThreadsContext) {
    Nan::HandleScope scope;

    uint32_t info_length = info.Length();
    /* Order of potential arguments
        uint32_t contextId,
        char *src,
        char *dest,
        uint32_t len,
        uint32_t offset,
    */
    if (info_length < 3) {
        Nan::ThrowTypeError(
            "Wrong number of arguments for multRegionMatrixThreadsContext");
        return ;
    }
#if SHOW_TIME
    double timer, init_time, process_time;
    timer_start(&timer);
#endif
    uint32_t contextId = Nan::To<uint32_t>(info[0]).FromJust();
    context_t *context = contextList[contextId];
    // data chunks
    char *src = node::Buffer::Data(info[1]);
    // parity chunks
    char *dest = node::Buffer::Data(info[2]);
    uint32_t len = context->len;
    if (info_length > 3) {
        len = Nan::To<uint32_t>(info[3]).FromJust();
    }
    // offset of parity
    if (info_length > 4) {
        uint32_t offset = Nan::To<uint32_t>(info[4]).FromJust();
        dest += offset;
    }

    pthread_t threads[context->rowsNb];
    thread_matrix_args thread_data[context->rowsNb];
    pthread_attr_t attr;
    void *status;
    int rc;

    /* Initialize and set thread detached attribute */
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_JOINABLE);

#if SHOW_TIME
    init_time = timer_split(&timer);
    timer_start(&timer);
#endif
    uint32_t i;
    char *_dest = dest;
    for (i = 0; i < context->rowsNb; i++) {
        thread_data[i].threadId = i;
        thread_data[i].coefsArr = context->coefsArr + i * context->colsNb;
        thread_data[i].src = src;
        thread_data[i].dest = _dest;
        thread_data[i].len = len;
        thread_data[i].colsNb = context->colsNb;
        thread_data[i].gfIndex = context->gfIndex;

        rc = pthread_create(&threads[i], &attr, doMultRegionMatrix,
            (void *)&thread_data[i]);
        _dest += len;
    }
    /* Free attribute and wait for the other threads */
    pthread_attr_destroy(&attr);
    for (i = 0; i < context->rowsNb; i++) {
        rc = pthread_join(threads[i], &status);
        if (rc) {
           printf("ERROR; return code from pthread_join() is %d\n", rc);
           exit(-1);
        }
    }
#if SHOW_TIME
    process_time = timer_split(&timer);
    float size = context->colsNb*len/1024.0/1024.0;
    printf("multRegionMatrixThreadsContext: init %.3es process %.3es  \
        MB: %10.3lf    %10.3lf MB/s vs. %10.3lf MB/s\n",
        init_time, process_time,
        size, size/(process_time), size/(process_time + init_time));
#endif
}

/*
 * Create and store a context (context_t)
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(initContext) {
    Nan::HandleScope scope;

    uint32_t infoLength = info.Length();
    /* Order of potential arguments
    int *coefs,
    uint32_t rowsNb,
    uint32_t colsNb,
    int len,
    int gfIndex
    */
    if (infoLength < 4) {
        Nan::ThrowTypeError("Wrong number of arguments for initContext");
        return ;
    }
    context_t *context;
    uint32_t contextId = 0;
    bool contextExist = (freedContext.size() > 0);
    if (contextExist) {
        // get and remove last freed context
        contextId = freedContext.back();
        freedContext.pop_back();
        context = contextList[contextId];
    } else {
        context = new context_t;
    }

#if SHOW_TIME
    double timer, init_time;
    timer_start(&timer);
#endif
    v8::Local<v8::Object> coefs =
        Nan::To<v8::Object>(info[0]).ToLocalChecked();
    context->rowsNb = Nan::To<uint32_t>(info[1]).FromJust();
    context->colsNb = Nan::To<uint32_t>(info[2]).FromJust();
    // chunk length
    context->len = Nan::To<uint32_t>(info[3]).FromJust();
    context->gfIndex = 0;
    if (infoLength > 4) {
        context->gfIndex = Nan::To<int>(info[4]).FromJust();
    }

    // read coefs
    context->coefsNb = context->rowsNb * context->colsNb;
    uint32_t i;
    context->coefsArr = new gf_general_t[context->coefsNb];
    for (i = 0; i < context->coefsNb; i++) {
        context->coefsArr[i].w32 = Nan::To<uint32_t>(Nan::Get(coefs, i).
            ToLocalChecked()).FromJust();
    }

    if (!contextExist) {
        contextId = contextList.size();
        contextList.push_back(context);
    }

    info.GetReturnValue().Set(Nan::New(contextId));

#if SHOW_TIME
    init_time = timer_split(&timer);
    timer_start(&timer);
    printf("initContext: init %.3es process %.3es \n", init_time);
#endif
}

/*
 * Remove a context (context_t)
 *  NOTE: Support only for w <= 32
 */
NAN_METHOD(removeContext) {
    Nan::HandleScope scope;

    /* Order of potential arguments
    uint32_t contextId
    */
    if (info.Length() != 1) {
        Nan::ThrowTypeError("Wrong number of arguments for removeContext");
        return ;
    }
    uint32_t contextId = Nan::To<int>(info[0]).FromJust();
    freedContext.push_back(contextId);
}

NAN_MODULE_INIT(Init) {
    NAN_EXPORT(target, init);
    NAN_EXPORT(target, add);
    NAN_EXPORT(target, multiply);
    NAN_EXPORT(target, divide);
    NAN_EXPORT(target, inverse);
    NAN_EXPORT(target, initContext);
    NAN_EXPORT(target, removeContext);
    NAN_EXPORT(target, multRegion);
    NAN_EXPORT(target, multRegionArr);
    NAN_EXPORT(target, multRegionMatrix);
    NAN_EXPORT(target, multRegionArrThreads);
    NAN_EXPORT(target, multRegionMatrixThreads);
    NAN_EXPORT(target, multRegionMatrixContext);
    NAN_EXPORT(target, multRegionMatrixThreadsContext);
}

NODE_MODULE(gfc, Init)
