import * as mdx from 'eslint-plugin-mdx';

import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    rules: {
      'import/no-unresolved': 'off'
    }
  },
  {
    ...mdx.flat,
    files: ['*.md', '*.mdx']
  }
];
