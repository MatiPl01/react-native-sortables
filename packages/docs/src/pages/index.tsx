import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import banner from '@site/static/img/banner.png';
import Layout from '@theme/Layout';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  console.log(siteConfig);
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <img alt='banner' src={banner} />
    </header>
  );
}

// eslint-disable-next-line import/no-unused-modules
export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      description='Description will go into a meta tag in <head />'
      title={`Hello from ${siteConfig.title}`}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
