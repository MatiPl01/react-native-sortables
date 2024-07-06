const path = require('path');

const rootDir = path.resolve(__dirname, '../..');

module.exports = {
  extends: path.join(rootDir, '.eslintrc.cjs'),
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json')
  },
  rules: {
    'no-relative-import-paths/no-relative-import-paths': 'off',
    'import/no-absolute-path': 'error'
  }
};
