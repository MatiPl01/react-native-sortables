/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

/**
 * Returns a mapping of dependencies to their resolved root paths.
 * If a dependency exists in both the common app and current app and the versions match,
 * it is resolved from ../../node_modules/. Otherwise, it is resolved from local node_modules/.
 *
 * @param {string} currentAppDir - The current app directory (e.g. __dirname)
 * @returns {Object<string, {root: string}>}
 */
function getDependencies(currentAppDir = '.') {
  const commonAppDir = path.resolve(__dirname, '..');
  /** @type {{ dependencies?: Record<string, string>, devDependencies?: Record<string, string> }} */
  const commonAppPkg = require(path.resolve(commonAppDir, 'package.json'));
  /** @type {{ dependencies?: Record<string, string>, devDependencies?: Record<string, string> }} */
  const currentAppPkg = require(path.resolve(currentAppDir, 'package.json'));

  // Merge all dependency names from both common and current app
  const allDeps = new Set([
    ...Object.keys(commonAppPkg.dependencies ?? {}),
    ...Object.keys(commonAppPkg.devDependencies ?? {}),
    ...Object.keys(currentAppPkg.dependencies ?? {}),
    ...Object.keys(currentAppPkg.devDependencies ?? {})
  ]);

  /** @type {Record<string, {root: string}>} */
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
