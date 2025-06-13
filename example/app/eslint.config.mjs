import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'warn',
        {
          allowedDepth: 1,
          allowSameFolder: true,
          prefix: '@',
          rootDir: './src'
        }
      ]
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        }
      }
    }
  }
];
