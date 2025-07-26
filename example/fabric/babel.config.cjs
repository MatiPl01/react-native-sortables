/**
 * Don't edit this file directly if you don't have to.
 * Modify the babel config file in the project root directory.
 */
const path = require('path');

const appDir = path.resolve(__dirname, '../app');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ts', '.tsx', '.svg', '.json'],
          // This needs to be mirrored in ../app/tsconfig.json
          alias: {
            '@': path.join(appDir, 'src')
          }
        }
      ],
      'react-native-worklets/plugin'
    ]
  };
};
