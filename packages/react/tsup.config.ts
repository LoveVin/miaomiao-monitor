import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.tsx'],
        format: ['cjs'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'dist/cjs',
        external: ['react', 'react/jsx-runtime'],
    },
    {
        entry: ['src/index.tsx'],
        format: ['esm'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'dist/esm',
        external: ['react', 'react/jsx-runtime'],
    },
])
