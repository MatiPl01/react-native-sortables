const path = require('path');

const rootDir = path.resolve(__dirname, '../..');

module.exports = {
  root: true,

  env: {
    es2020: true,
    node: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/recommended',
    'plugin:markdown/recommended',
    'plugin:mdx/recommended',
    'prettier'
  ],

  plugins: [
    'react',
    'react-hooks',
    'react-native',
    'import',
    'unused-imports',
    'simple-import-sort',
    'no-relative-import-paths',
    'perfectionist',
    'prettier'
  ],

  // Global-level rules that apply to all files
  rules: {
    'react/react-in-jsx-scope': 'off'
  },

  settings: {
    'import/resolver': {
      typescript: {
        project: path.resolve(__dirname, './tsconfig.json'),
        alwaysTryTypes: true
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.md', '.mdx']
      }
    },
    react: {
      version: 'detect'
    }
  },

  overrides: [
    // 1) TypeScript Override
    {
      files: ['*.ts', '*.tsx'],
      extends: path.join(rootDir, '.eslintrc.cjs'),
      rules: {
        'import/no-unresolved': 'off'
      }
    },

    // 2) MDX Override
    {
      files: ['*.md', '*.mdx'],
      parser: 'eslint-mdx',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        allowImportExportEverywhere: true
      }
    }
  ]
};
