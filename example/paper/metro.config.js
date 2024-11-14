const path = require('path');
const getWorkspaces = require('get-yarn-workspaces');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const {
  wrapWithReanimatedMetroConfig
} = require('react-native-reanimated/metro-config');

const workspaces = getWorkspaces(__dirname).filter(
  // Include all workspaces except fabric in the paper example
  workspaceDir => !workspaceDir.includes('fabric')
);

const customConfig = {
  watchFolders: [path.resolve(__dirname, '../../node_modules'), ...workspaces]
};

module.exports = wrapWithReanimatedMetroConfig(
  mergeConfig(getDefaultConfig(__dirname), customConfig)
);
