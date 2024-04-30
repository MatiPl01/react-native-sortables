/**
 * Don't edit this file directly if you don't have to.
 * Modify the babel config file in the project root directory.
 */
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const rootPkg = require(path.join(rootDir, 'package.json'));

const appDir = path.resolve(__dirname, '../app');
const appPkg = require(path.join(appDir, 'package.json'));

module.exports = function (api) {
  api.cache(true);
  return {
    extends: path.join(rootDir, 'babel.config.cjs'),
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ts', '.tsx', '.svg', '.json'],
          // This needs to be mirrored in ../app/tsconfig.json
          alias: {
            '@lib': path.join(rootDir, rootPkg['react-native']),
            '@app': path.join(appDir, appPkg['react-native'])
          }
        }
      ],
    ]
  };
};
