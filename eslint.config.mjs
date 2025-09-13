import baseConfig from 'eslint-config-react-native-matipl01';

export default [
  {
    ignores: [
      '.yarn/**',
      'example/**',
      '!example/app/**',
      'packages/docs/**',
      'scripts/**',
      '.github/actions/**',
      '**/bob.config.cjs',
      '**/babel.config.cjs',
      '**/jest.setup.js',
      '**/dist',
      '**/README.md',
      '**/CONTRIBUTING.md',
      '**/CHANGELOG.md'
    ]
  },
  ...baseConfig
];
