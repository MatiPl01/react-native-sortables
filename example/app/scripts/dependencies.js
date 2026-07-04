const path = require('path');

const commonAppDir = path.resolve(__dirname, '..');

// Resolve where a dependency actually lives from an app's perspective - its own
// node_modules, or the monorepo root once yarn hoists it. Using `require.resolve`
// is hoist-proof, so an app that pins a divergent major (e.g. gesture-handler v3
// in the fabric example) autolinks that version rather than a guessed path.
function getRootPath(moduleName, currentAppDir) {
  try {
    return path.dirname(
      require.resolve(`${moduleName}/package.json`, {
        paths: [currentAppDir, commonAppDir]
      })
    );
  } catch {
    return path.resolve(currentAppDir, `../../node_modules/${moduleName}`);
  }
}

function getDependencies(currentAppDir = '.', excludeCommon = []) {
  const commonAppPkg = require(path.resolve(commonAppDir, 'package.json'));
  const currentAppPkg = require(path.resolve(currentAppDir, 'package.json'));

  const excluded = new Set(excludeCommon);
  const names = [
    ...Object.keys(commonAppPkg.dependencies ?? {}),
    ...Object.keys(commonAppPkg.devDependencies ?? {}),
    ...Object.keys(currentAppPkg.dependencies ?? {}),
    ...Object.keys(currentAppPkg.devDependencies ?? {})
  ].filter(name => !excluded.has(name));

  const result = {};
  for (const name of new Set(names)) {
    result[name] = { root: getRootPath(name, currentAppDir) };
  }

  return result;
}

module.exports = {
  getDependencies
};
