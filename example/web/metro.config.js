const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const monorepoRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname, monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../app/node_modules'),
  path.resolve(monorepoRoot, 'node_modules')
];

module.exports = config;
