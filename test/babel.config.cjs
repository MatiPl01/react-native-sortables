/**
 * This babel config is used by jest in the testing environment.
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    'react-native-worklets/plugin'
  ]
};
