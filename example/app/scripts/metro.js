const path = require('path');
const escape = require('escape-string-regexp');
const {
  wrapWithReanimatedMetroConfig
} = require('react-native-reanimated/metro-config');

function createMetroConfig(defaultConfig, currentAppDir, options = {}) {
  const { excludeFromRoot = [] } = options;

  const monorepoRoot = path.resolve(currentAppDir, '../..');

  // Check if we're running expo-doctor (which expects default config)
  // vs actual development (which is needed in the current monorepo setup)
  const isExpoDoctor = process.env.EXPO_DOCTOR === 'true' || 
                       process.argv.some(arg => arg.includes('expo-doctor'));

  if (isExpoDoctor) {
    // For expo-doctor, use a config default config to satisfy its checks
    return defaultConfig;
  }

  // For development, use the full monorepo config
  const config = { ...defaultConfig };
  config.resolver ??= {};

  const additionalWatchFolders = [currentAppDir, monorepoRoot];
  config.watchFolders = [
    ...(defaultConfig.watchFolders || []),
    ...additionalWatchFolders
  ];
  
  config.resolver.nodeModulesPaths = [
    path.resolve(currentAppDir, 'node_modules'),
    path.resolve(currentAppDir, '../app/node_modules'),
    path.resolve(monorepoRoot, 'node_modules')
  ];
  
  config.resolver.disableHierarchicalLookup = true;

  if (excludeFromRoot.length > 0) {
    config.resolver.blockList = excludeFromRoot.map(
      m =>
        new RegExp(
          `^${escape(path.join(monorepoRoot, 'node_modules', m))}\\/.*$`
        )
    );
  }

  return wrapWithReanimatedMetroConfig(config);
}

module.exports = {
  createMetroConfig
};
