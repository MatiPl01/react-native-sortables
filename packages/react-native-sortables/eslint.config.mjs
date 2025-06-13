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
      'import/no-absolute-path': 'error',
      'no-relative-import-paths/no-relative-import-paths': 'off'
    }
  }
];
