import baseConfig from 'eslint-config-react-native-matipl01';

export default [
  {
    ignores: [
      '.yarn/**',
      'example/**',
      '!example/app/**',
      'packages/docs/**',
      '**/bob.config.cjs',
      '**/babel.config.cjs',
      '**/jest.setup.js',
      '**/dist',
      '**/README.md',
      '**/CONTRIBUTING.md'
    ]
  },
  ...baseConfig
];
