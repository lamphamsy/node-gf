
#ifndef NODE_GF_SIMD_FLAGS_H
#define NODE_GF_SIMD_FLAGS_H

#ifdef _MSC_VER

#if (defined(_M_IX86_FP) && _M_IX86_FP == 2) || defined(_M_X64)
	#define INTEL_SSE2
	#define INTEL_SSSE3
	#if _MSC_VER >= 1600
		#define INTEL_SSE4_PCLMUL
	#endif
#endif
#if defined(__AVX2__) || (_MSC_VER >= 1800 && defined(INTEL_SSE2))
	#define INTEL_AVX2
#endif

#else /* _MSC_VER */

#ifdef __SSE2__
	#define INTEL_SSE2
#endif
#ifdef __SSSE3__
	#define INTEL_SSSE3
#endif
#ifdef __PCLMUL__
	#define INTEL_SSE4_PCLMUL
#endif
#ifdef __AVX2__
	#define INTEL_AVX2
#endif

#endif /* _MSC_VER */

#ifdef __AVX512BW__
	#define INTEL_AVX512BW
#endif

#ifdef __ARM_NEON__
	#define ARM_NEON
#endif
#if defined(__ARM_ARCH) && __ARM_ARCH >= 8
	#define ARCH_AARCH64
#endif

#endif /* NODE_GF_SIMD_FLAGS_H */
