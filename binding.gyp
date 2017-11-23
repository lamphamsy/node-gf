{
  "targets": [
    {
        "target_name": "gf",
        "sources": [
            "gf.cpp"
        ],
        "include_dirs" : [
            "<!(node -e \"require('nan')\")",
            "<(module_root_dir)/gf-complete/libs/include"
        ],
        'variables': {
            'LIBDIR': '<(module_root_dir)/gf-complete/libs/lib',
        },
        "conditions": [
            ['OS == "mac"', {
                'xcode_settings': {
                    'GCC_OPTIMIZATION_LEVEL': '3',  # -O3
                    'OTHER_CFLAGS': [
                        '-fno-operator-names',
                    ],
                },
                "libraries": [ "<(LIBDIR)/libgf_complete.dylib" ]
            }],
            ['OS == "linux"', {
                'cflags': [
                    '-O3',
                    '-fno-operator-names',
                ],
                'ldflags': [
                    '-Wl,-rpath -Wl,<(LIBDIR)',
                ],
                "libraries": [ "<(LIBDIR)/libgf_complete.so" ]
            }],
        ],
    }
  ]
}
