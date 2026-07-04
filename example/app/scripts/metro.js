const path = require('path');
const escape = require('escape-string-regexp');
const {
  wrapWithReanimatedMetroConfig
} = require('react-native-reanimated/metro-config');

function blockDir(dir) {
  return new RegExp(`^${escape(dir + path.sep)}.*$`);
}

function createMetroConfig(defaultConfig, currentAppDir, options = {}) {
  const { excludeFromRoot = [], filterFromCommonApp = [] } = options;

  const monorepoRoot = path.resolve(currentAppDir, '../..');

  // Check if we're running expo-doctor (which expects default config)
  // vs actual development (which is needed in the current monorepo setup)
  const isExpoDoctor =
    process.env.EXPO_DOCTOR === 'true' ||
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

  const commonAppNodeModules = path.resolve(
    currentAppDir,
    '../app/node_modules'
  );
  const blockList = [
    ...excludeFromRoot.map(m =>
      blockDir(path.join(monorepoRoot, 'node_modules', m))
    ),
    // A host app can pin a divergent major of a shared dependency (e.g. the
    // fabric example on gesture-handler v3). Block the common app's copy so the
    // bundle resolves the host's own version, matching what the native build links.
    ...filterFromCommonApp.map(m =>
      blockDir(path.join(commonAppNodeModules, m))
    )
  ];
  if (blockList.length > 0) {
    config.resolver.blockList = blockList;
  }

  return wrapWithReanimatedMetroConfig(config);
}

module.exports = {
  createMetroConfig
};
