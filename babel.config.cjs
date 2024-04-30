/**
 * Modify this babel config file when you need to add a new plugin.
 */
const path = require('path');

const rootDir = path.resolve(__dirname);
const rootPkg = require(path.join(rootDir, 'package.json'));

module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ts', '.tsx', '.svg', '.json'],
        alias: {
          // This needs to be mirrored in ./tsconfig.json
          '@lib': path.join(rootDir, rootPkg['react-native'])
        }
      }
    ]
  ]
};
