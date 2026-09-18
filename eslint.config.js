const eslint = require('@eslint/js')
const prettierConfig = require('eslint-config-prettier')
const prettierPlugin = require('eslint-plugin-prettier')
const simpleImportSort = require('eslint-plugin-simple-import-sort')
const typescriptEslint = require('typescript-eslint')

module.exports = typescriptEslint.config(
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.turbo/**',
            '**/coverage/**',
            '**/*.d.ts',
            '**/*.config.js',
            '**/*.config.cjs',
            'eslint.config.js',
        ],
    },
    eslint.configs.recommended,
    ...typescriptEslint.configs.recommended,
    prettierConfig,
    {
        files: ['**/*.{js,mjs,cjs,ts,tsx}'],
        plugins: {
            prettier: prettierPlugin,
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            'no-console': 'error',
            'prettier/prettier': 'error',
            'simple-import-sort/exports': 'error',
            'simple-import-sort/imports': 'error',
        },
    }
)
