// eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
    // 1. Global Ignores
    {
        ignores: [
            '**/dist/**',
            '**/packages/**',
            '**/data/**',
            '**/apps/worker/**',
            '**/apps/sower/**',
            '**/vcode/**',
            '**/coverage/**',
            '**/node_modules/**',
            '**/*.d.ts',
            '**/.wrangler/**',
            '**/apps/995.library/**',
        ],
    },

    // 2. Main Config
    {
        // ⬇️ UPGRADE: Use "TypeChecked" configs to enable semantic rules
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        files: ['**/*.{ts,tsx}'], // Only run type-checking on TS files
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.node,
            parserOptions: {
                // ⬇️ THE MAGIC SETTING: Enables high-performance monorepo linting
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'no-console': 'warn',

            // ⬇️ TYPE-AWARE RULES (Only possible with projectService)
            '@typescript-eslint/no-floating-promises': 'error', // Catch unawaited promises
            '@typescript-eslint/await-thenable': 'error', // Catch awaiting non-promises
            '@typescript-eslint/no-explicit-any': 'error', // Enforce strict typing
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },

    // 3. Disable type-checking for JS files (Build scripts, configs)
    {
        extends: [tseslint.configs.disableTypeChecked],
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    },
)
