/**
 * This babel config is used by jest in the testing environment.
 */
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
  extends: path.join(rootDir, 'babel.config.cjs'),
  presets: ['module:@react-native/babel-preset']
};
