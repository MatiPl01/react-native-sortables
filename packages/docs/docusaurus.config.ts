import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

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
  presets: [
    [
      'classic',
      {
        blog: {
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true
          },
          // Please change this to your repo.
          onInlineAuthors: 'warn',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onUntruncatedBlogPosts: 'warn',
          showReadingTime: true
        },
        docs: {
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Please change this to your repo.
          sidebarPath: './sidebars.ts'
        },
        theme: {
          customCss: './src/css/custom.css'
        }
      } satisfies Preset.Options
    ]
  ],

  projectName: 'react-native-sortable', // Usually your repo name.
  tagline: 'React Native Sortable',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  themeConfig: {
    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} React Native Sortable`,
      links: [
        {
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro'
            }
          ],
          title: 'Docs'
        },
        {
          items: [
            {
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
              label: 'Stack Overflow'
            },
            {
              href: 'https://discordapp.com/invite/docusaurus',
              label: 'Discord'
            },
            {
              href: 'https://x.com/docusaurus',
              label: 'X'
            }
          ],
          title: 'Community'
        },
        {
          items: [
            {
              label: 'Blog',
              to: '/blog'
            },
            {
              href: 'https://github.com/facebook/docusaurus',
              label: 'GitHub'
            }
          ],
          title: 'More'
        }
      ],
      style: 'dark'
    },
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      items: [
        {
          label: 'Docs',
          position: 'left',
          sidebarId: 'tutorialSidebar',
          type: 'docSidebar'
        },
        { label: 'Blog', position: 'left', to: '/blog' },
        {
          href: 'https://github.com/MatiPl01/react-native-sortable',
          label: 'GitHub',
          position: 'right'
        }
      ],
      logo: {
        alt: 'React Native Sortable Logo',
        src: 'img/logo.svg'
      },
      title: 'Sortable'
    },
    prism: {
      darkTheme: prismThemes.dracula,
      theme: prismThemes.github
    }
  } satisfies Preset.ThemeConfig,

  title: 'Sortable',

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com'
};

export default config;
