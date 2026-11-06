import baseConfig from 'eslint-config-react-native-matipl01';

// Reanimated hooks that accept a dependency list and warn when one reaches them
// on native (see webOnlyDependencies in src/integrations/reanimated)
const REANIMATED_DEPENDENCY_HOOKS = [
  'useAnimatedProps',
  'useAnimatedReaction',
  'useAnimatedStyle',
  'useDerivedValue'
].join('|');

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
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // These hooks take only functions before the dependency list, so a
          // direct array argument is always one.
          message:
            'Wrap the dependency list in webOnlyDependencies(). Reanimated ignores dependencies on native and warns when an array reaches it there.',
          selector: `CallExpression[callee.name=/^(${REANIMATED_DEPENDENCY_HOOKS})$/] > ArrayExpression`
        }
      ]
    }
  }
];
