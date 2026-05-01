// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import perfectionist from 'eslint-plugin-perfectionist';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '**/*.generated.ts',
      '**/*.d.ts',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginPrettierRecommended,

  // ─── Language / Parser Options ───────────────────────────────────────────────
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ─── Import-X ────────────────────────────────────────────────────────────────
  {
    plugins: { 'import-x': importX },
    rules: {
      'import-x/no-duplicates': 'error',
      'import-x/no-cycle': ['warn', { maxDepth: 3 }], // warn: forwardRef() patterns in NestJS
      'import-x/no-self-import': 'error',
      'import-x/consistent-type-specifier-style': ['error', 'prefer-inline'],
    },
  },

  // ─── Perfectionist (import ordering) ─────────────────────────────────────────
  {
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          newlinesBetween: 1,
          groups: [
            'side-effect', // import './polyfills'
            'side-effect-style', // import './styles.css'
            'value-builtin', // import fs from 'fs'          (was: builtin)
            'value-external', // import express from 'express' (was: external)
            'value-internal', // import { X } from '@/x'      (was: internal)
            ['value-parent', 'value-sibling', 'value-index'], // relative imports
            'type-builtin', // import type { X } from 'fs'
            'type-external', // import type { X } from 'express'
            'type-internal', // import type { X } from '@/x'
            ['type-parent', 'type-sibling', 'type-index'], // relative type imports
          ],
          internalPattern: ['^@/.*', '^~/.*', '^src/.*'],
        },
      ],
      'perfectionist/sort-named-imports': [
        'error',
        { type: 'natural', order: 'asc' },
      ],
    },
  },

  // ─── NestJS — Decorator & DI aware rules ─────────────────────────────────────
  {
    rules: {
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false, // async Guards, Interceptors, Pipes
            arguments: false, // async functions passed to rxjs operators
          },
        },
      ],

      '@typescript-eslint/no-non-null-assertion': 'warn', // DI tokens often need this

      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],

      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true, // @Module(), @Controller() empty classes
          allowConstructorOnly: false,
          allowStaticOnly: false,
        },
      ],

      '@typescript-eslint/no-unsafe-member-access': 'warn', // reflect-metadata calls
      '@typescript-eslint/no-unsafe-assignment': 'error', // ConfigService.get<T>()
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
    },
  },

  // ─── NestJS file-level overrides ─────────────────────────────────────────────
  {
    // Spec files — relax strict rules that conflict with jest mocking patterns
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off', // jest.fn() returns any
      '@typescript-eslint/no-unsafe-member-access': 'off', // mock.calls[0][0] etc.
      '@typescript-eslint/no-explicit-any': 'off', // Partial<Service> mocks
      '@typescript-eslint/unbound-method': 'off', // expect(service.method) pattern
      'import-x/no-cycle': 'off', // test modules import freely
      'max-lines-per-function': 'off', // describe() blocks can be long
      'max-params': 'off', // test setup functions
    },
  },
  {
    // DTO files — class-validator decorators produce intentionally untyped metadata
    files: ['**/*.dto.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off', // @IsString(), @IsEmail() etc.
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    // Entity files (TypeORM / Prisma) — decorators and nullable columns
    files: ['**/*.entity.ts', '**/*.schema.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off', // @Column(), @Prop() etc.
      '@typescript-eslint/no-non-null-assertion': 'off', // TypeORM column defaults
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  {
    // Migration files — raw SQL, intentional any usage
    files: ['**/migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-console': 'off',
    },
  },

  // ─── Core TypeScript Rules ───────────────────────────────────────────────────
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: true, // Guard return types: boolean | Observable<boolean>
        },
      ],
      '@typescript-eslint/only-throw-error': 'error',
    },
  },

  // ─── Code Style & Structure ───────────────────────────────────────────────────
  {
    rules: {
      // ── Braces ──────────────────────────────────────────────────────────────
      curly: ['error', 'all'], // always braces for if/else/for/while

      // ── Spacing between statements ───────────────────────────────────────────
      'padding-line-between-statements': [
        'error',
        // blank line before return / throw
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'throw' },
        // blank line after variable declaration blocks
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
        // blank line around if / for / while / try blocks
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: 'if', next: '*' },
        { blankLine: 'always', prev: '*', next: ['for', 'while', 'do'] },
        { blankLine: 'always', prev: ['for', 'while', 'do'], next: '*' },
        { blankLine: 'always', prev: '*', next: 'try' },
        { blankLine: 'always', prev: 'try', next: '*' },
        // blank line after imports
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
      ],

      // ── Guard clauses / early returns ────────────────────────────────────────
      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'error',

      // ── Variable declarations ────────────────────────────────────────────────
      'one-var': ['error', 'never'], // no: let a = 1, b = 2
      'prefer-const': 'error',
      'no-var': 'error',

      // ── Ternary ──────────────────────────────────────────────────────────────
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',

      // ── Comparisons ──────────────────────────────────────────────────────────
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      yoda: ['error', 'never'], // no: if ('value' === x)

      // ── Functions ────────────────────────────────────────────────────────────
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],

      // ── Objects / Arrays ─────────────────────────────────────────────────────
      'object-shorthand': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: false, // skip: unclear with index access
          object: true, // enforce: const { id } = obj
        },
      ],

      // ── Strings ──────────────────────────────────────────────────────────────
      'prefer-template': 'error',

      // ── Error handling ───────────────────────────────────────────────────────
      'no-throw-literal': 'error',

      // ── Console / Debugging ──────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-alert': 'error',

      // ── Param reassignment ───────────────────────────────────────────────────
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: [
            'acc', // reduce accumulators
            'req',
            'res', // Express/Fastify
            'ctx', // NestJS execution context
            'draft', // Immer
            'state', // Redux
          ],
        },
      ],

      // ── Complexity limits ────────────────────────────────────────────────────
      complexity: ['warn', { max: 10 }],
      'max-depth': ['warn', { max: 4 }],
      'max-lines-per-function': [
        'warn',
        {
          max: 60,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-params': ['warn', { max: 4 }], // NestJS DI handles this via constructors
    },
  },

  // ─── Prettier ─────────────────────────────────────────────────────────────────
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
