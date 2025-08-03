/**
 * This file is required to properly resolve native dependencies
 */
const { getDependencies } = require('../app/scripts/dependencies');

module.exports = {
  dependencies: getDependencies(__dirname, ['react-native-worklets'])
};
