{
  "targets": [
    {
        "target_name": "gf",
        "sources": [
            "gf.cpp"
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
                    'GCC_OPTIMIZATION_LEVEL': '3',  # -O3
                    'OTHER_CFLAGS': [
                        '-fno-operator-names',
                    ],
                },
                "libraries": [ "<(module_root_dir)/gf-complete/src/.libs/libgf_complete.dylib" ]
            }],
            ['OS == "linux"', {
                'cflags': [
                    '-O3',
                    '-fno-operator-names',
                ],
                "libraries": [ "<(module_root_dir)/gf-complete/src/.libs/libgf_complete.so" ]
            }],
        ],
    }
  ]
}
