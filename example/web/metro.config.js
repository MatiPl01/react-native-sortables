const { getDefaultConfig } = require('expo/metro-config');
const { createMetroConfig } = require('../app/scripts/metro');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = createMetroConfig(defaultConfig, __dirname, {
  // This example runs gesture-handler v3 on web (so it exercises the v3 hook
  // adapter); resolve it from this app rather than the v2 copy pinned by the
  // shared example app.
  filterFromCommonApp: ['react-native-gesture-handler']
});
