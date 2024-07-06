/**
 * This file is required to properly resolve native dependencies
 */
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const rootPkg = require(path.join(rootDir, 'package.json'));

const appDir = path.resolve(__dirname, '../app');
const appPkg = require(path.resolve(appDir, 'package.json'));

let dependencies = {};

console.log('rootPkg', rootPkg);
console.log('appPkg', appPkg);

[
  // Include library dependencies that will normally be installed with
  // the library (dependencies in the top-level package.json)
  ...Object.keys(rootPkg.dependencies || {}),
  // Include example app dependencies that will be normally available
  // (both dependencies and devDependencies in the example app's package.json)
  ...Object.keys(appPkg.devDependencies || {}),
  ...Object.keys(appPkg.dependencies || {})
].forEach(dep => {
  dependencies[dep] = {
    root: path.resolve(__dirname, `../../node_modules/${dep}`)
  };
});

console.log('dependencies', dependencies);

module.exports = { dependencies };
