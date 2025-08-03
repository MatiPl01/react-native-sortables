const path = require('path');
const escape = require('escape-string-regexp');
const {
  wrapWithReanimatedMetroConfig
} = require('react-native-reanimated/metro-config');

function createMetroConfig(defaultConfig, currentAppDir, options = {}) {
  const { excludeFromRoot = [] } = options;

  const monorepoRoot = path.resolve(currentAppDir, '../..');

  const config = { ...defaultConfig };
  config.resolver ??= {};

  config.watchFolders = [currentAppDir, monorepoRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(currentAppDir, 'node_modules'),
    path.resolve(currentAppDir, '../app/node_modules'),
    path.resolve(monorepoRoot, 'node_modules')
  ];
  config.resolver.disableHierarchicalLookup = true;

  if (excludeFromRoot.length > 0) {
    config.resolver.blacklistRE = excludeFromRoot.map(
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
