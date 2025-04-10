module.exports = {
  source: 'src',
  output: 'dist',
  exclude: [
    '**/{__tests__,__fixtures__,__mocks__}/**',
    '**/*.test.{js,jsx,ts,tsx}'
  ],
  targets: [
    ['module', { configFile: true }],
    ['typescript', { project: 'tsconfig.build.json' }]
  ]
};
