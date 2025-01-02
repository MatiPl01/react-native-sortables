const path = require('path');
const getWorkspaces = require('get-yarn-workspaces');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const {
  wrapWithReanimatedMetroConfig
} = require('react-native-reanimated/metro-config');

const workspaces = getWorkspaces(__dirname).filter(
  // Include all workspaces except paper in the fabric example
  workspaceDir => !workspaceDir.includes('paper')
);

const customConfig = {
  watchFolders: [path.resolve(__dirname, '../../node_modules'), ...workspaces]
};

module.exports = wrapWithReanimatedMetroConfig(
  mergeConfig(getDefaultConfig(__dirname), customConfig)
);
