{
  "targets": [
    {
        "target_name": "gf",
        "sources": [
            "gf.cpp",
            "<!@(node -p \"require('fs').readdirSync('./gf-complete/src').map(f=>'gf-complete/src/'+f).join(' ')\")",
            #TODO: neon src files if relevant
        ],
        "include_dirs" : [
            "<!(node -e \"require('nan')\")",
            "gf-complete/include"
        ],
        'variables': {
            'have_neon': '<!()'
        },
        "conditions": [
            ['OS == "mac"', {
                'xcode_settings': {
                    # gcc on the mac builds horribly unoptimized sse code in debug
                    # mode. Since this is rarely going to be debugged, run with full
                    # optimizations in Debug as well as Release.
                    'GCC_OPTIMIZATION_LEVEL': '3',  # -O3
                    'OTHER_CFLAGS': [
                        '-march=native',
                        '-mavx2',
                        '-fPIC -Wall -Wpointer-arith',
                    ],
                   },
                }
            ],
        ],
    }
  ]
}
