const { getDefaultConfig } = require('expo/metro-config');
const { createMetroConfig } = require('../app/scripts/metro');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = createMetroConfig(defaultConfig, __dirname);
