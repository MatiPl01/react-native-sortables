module.exports = {
  extends: 'react-native-matipl01',
  rules: {
    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: false,
        afterBlockComment: false,
        beforeLineComment: false,
        afterLineComment: false,
        allowBlockStart: true,
        allowClassStart: true,
        allowObjectStart: true,
        allowArrayStart: true
      }
    ],
    'perfectionist/sort-enums': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'enumMember',
        format: ['UPPER_CASE']
      }
    ]
  }
};
