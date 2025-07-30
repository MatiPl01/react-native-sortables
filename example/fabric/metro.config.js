const { getDefaultConfig } = require('@react-native/metro-config');
const { createMetroConfig } = require('../app/scripts/metro');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = createMetroConfig(defaultConfig, __dirname, {
  excludeFromRoot: ['react-native-reanimated']
});
