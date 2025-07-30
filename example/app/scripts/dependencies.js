const path = require('path');

function getDependencies(currentAppDir = '.') {
  const commonAppDir = path.resolve(__dirname, '..');
  const commonAppPkg = require(path.resolve(commonAppDir, 'package.json'));
  const currentAppPkg = require(path.resolve(currentAppDir, 'package.json'));

  const allDeps = new Set([
    ...Object.keys(commonAppPkg.dependencies ?? {}),
    ...Object.keys(commonAppPkg.devDependencies ?? {}),
    ...Object.keys(currentAppPkg.dependencies ?? {}),
    ...Object.keys(currentAppPkg.devDependencies ?? {})
  ]);

  const result = {};

  for (const dep of allDeps) {
    // Find versions in both package.json files
    const commonVersion =
      commonAppPkg.dependencies?.[dep] ?? commonAppPkg.devDependencies?.[dep];
    const currentVersion =
      currentAppPkg.dependencies?.[dep] ?? currentAppPkg.devDependencies?.[dep];

    if (!commonVersion || !currentVersion || commonVersion === currentVersion) {
      result[dep] = {
        root: path.resolve(currentAppDir, `../../node_modules/${dep}`)
      };
    } else {
      // Include from the local node_modules only if the dependency is present
      // in the current app and versions are different
      result[dep] = {
        root: path.resolve(currentAppDir, `node_modules/${dep}`)
      };
    }
  }

  return result;
}

module.exports = {
  getDependencies
};
