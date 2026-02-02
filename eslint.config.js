// eslint.config.js
import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import a11y from 'eslint-plugin-jsx-a11y'

export default [
  // Global ignores (must be first)
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'dist-offline/**',
      'dist-offline-build/**',
      'coverage/**',
      '*.config.js',
      'public/service-worker.js',
      'scripts/**',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/*.test.js',
      '**/*.test.jsx'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'jsx-a11y': a11y
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        FileReader: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        MutationObserver: 'readonly',
        process: 'readonly',
        Element: 'readonly',
        // remove these if you now import them as modules:
        DOMPurify: 'readonly',
        marked: 'readonly',
        FullCalendar: 'readonly'
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
      'no-unused-vars': 'error', // Changed from 'warn' to 'error'
      'no-console': 'warn', // Warn on console usage - use logger utility instead
      'react/react-in-jsx-scope': 'off' // Not needed in React 17+
    }
  },
  // Test environment configuration
  {
    files: [
      '**/setupTests.js',
      '**/__tests__/**/*.js',
      '**/*.test.js',
      '**/*.test.jsx'
    ],
    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    }
  }
]
