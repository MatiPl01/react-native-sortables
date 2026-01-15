import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import path from 'path';
import { themes as prismThemes } from 'prism-react-renderer';
import webpack from 'webpack';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },

  onBrokenLinks: 'throw',
  // Set the /<baseUrl>/ pathname under which your site is served
  onBrokenMarkdownLinks: 'warn',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'MatiPl01', // Usually your GitHub org/user name.
  plugins: [
    function (context, options) {
      return {
        configureWebpack(config, isServer, utils) {
          if (config.resolve && config.resolve.extensions) {
            config.resolve.extensions.unshift(
              '.web.js',
              '.web.jsx',
              '.web.ts',
              '.web.tsx'
            );
          }

          const reactNativePath = path.resolve(
            __dirname,
            '../../node_modules/react-native'
          );
          const relatedPackages = [
            path.resolve(
              __dirname,
              '../../node_modules/react-native-gesture-handler'
            ),
            path.resolve(__dirname, 'node_modules/react-native-gesture-handler')
          ];

          const alias = {
            'react-native$': 'react-native-web',
            'react-native-sortables': path.resolve(
              __dirname,
              '../react-native-sortables/src/index.ts'
            )
          };

          // Polyfill requestAnimationFrame (matching reanimated docs)
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const raf = require('raf');
          raf.polyfill();

          return {
            ignoreWarnings: [
              {
                message: /Critical dependency: require function is used/,
                module: /react-native-worklets\/lib\/module\/initializers\.js/
              },
              {
                message:
                  /Critical dependency: the request of a dependency is an expression/,
                module: /typescript\/lib/
              }
            ],
            mergeStrategy: {
              'resolve.extensions': 'prepend'
            },
            module: {
              rules: [
                // Rule for TS/TSX files
                {
                  test: /\.tsx?$/,
                  use: 'babel-loader'
                },
                // Rule for JS files
                {
                  test: /\.js$/,
                  use: 'babel-loader'
                },
                // Mock internal React Native modules that don't work on web
                {
                  test: /node_modules\/react-native\/Libraries\/Pressability\/PressabilityDebug/,
                  use: 'null-loader'
                },
                {
                  test: /node_modules\/react-native\/Libraries\/ReactNative\/ReactFabricPublicInstance/,
                  use: 'null-loader'
                },
                {
                  test: /node_modules\/react-native\/Libraries\/Renderer\/shims/,
                  use: 'null-loader'
                },
                {
                  test: /node_modules\/react-native\/Libraries\/Utilities\/codegenNativeComponent/,
                  use: 'null-loader'
                },
                {
                  include: [reactNativePath],
                  test: /src\/private\/webapis\/dom/,
                  use: 'null-loader'
                }
              ]
            },
            plugins: [
              new webpack.DefinePlugin({
                __DEV__: process.env.NODE_ENV !== 'production',
                process: { env: {} }
              })
            ],
            resolve: {
              alias,
              extensions: ['.web.js', '...']
            }
          };
        },
        name: 'webpack-config-plugin'
      };
    }
  ],

  presets: [
    [
      'classic',
      {
        blog: {
          editUrl:
            'https://github.com/MatiPl01/react-native-sortables/edit/main/packages/docs/',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true
          },
          onInlineAuthors: 'warn',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onUntruncatedBlogPosts: 'warn',
          showReadingTime: true
        },
        docs: {
          editUrl:
            'https://github.com/MatiPl01/react-native-sortables/edit/main/packages/docs/',
          routeBasePath: '/',
          // Please change this to your repo.
          sidebarPath: './sidebars.ts'
        },
        theme: {
          customCss: './src/css/custom.css'
        }
      } satisfies Preset.Options
    ]
  ],
  projectName: 'react-native-sortables', // Usually your repo name.

  tagline: 'React Native Sortables',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  themeConfig: {
    algolia: {
      apiKey: '8a07143e93904e0bcdc9e2286393b107',
      appId: 'I4ZZR4R13B',
      indexName: 'react-native-sortables-vercel'
    },
    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} | React Native Sortables by MatiPl01`,
      links: [],
      style: 'dark'
    },
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg', // TODO - change image
    navbar: {
      items: [
        {
          label: 'Docs',
          position: 'left',
          sidebarId: 'tutorialSidebar',
          type: 'docSidebar'
        },
        // { label: 'Blog', position: 'left', to: '/blog' },
        {
          href: 'https://github.com/MatiPl01/react-native-sortables',
          label: 'GitHub',
          position: 'right'
        }
      ],
      logo: {
        alt: 'React Native Sortables Logo',
        src: 'img/logo.svg'
      },
      title: 'Sortables'
    },
    prism: {
      darkTheme: prismThemes.vsDark,
      theme: prismThemes.github
    }
  } satisfies Preset.ThemeConfig,

  title: 'Sortables',
  // Set the production url of your site here
  // TODO - change url
  url: 'https://your-docusaurus-site.example.com'
};

export default config;
