import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        platform: 'node',
        target: 'node18',
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'dist/cjs',
    },
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        platform: 'node',
        target: 'node18',
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'dist/esm',
    },
])
