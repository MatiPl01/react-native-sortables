import { clsx } from 'clsx';
import type { ReactElement } from 'react';
import React, { Children, useMemo, useState } from 'react';

import styles from './styles.module.css';

type TabsProps = {
  children: Array<React.ReactElement<TabItemProps>>;
};

function TabView({ children }: TabsProps) {
  const childrenArray = useMemo(
    () => Children.toArray(children) as Array<ReactElement<TabItemProps>>,
    [children]
  );
  const [activeTabIndex, setActiveTabIndex] = useState<number>(() =>
    Math.max(
      childrenArray.findIndex(child => child.props.default),
      0
    )
  );

  return (
    <section>
      <div className={styles.tabList}>
        {childrenArray.map((child, index) => (
          <button
            key={index}
            className={clsx(styles.tabButton, {
              [styles.active]: index === activeTabIndex
            })}
            onClick={() => setActiveTabIndex(index)}>
            {child.props.label}
          </button>
        ))}
      </div>
      <article className={styles.tabContent}>
        {childrenArray[activeTabIndex]}
      </article>
    </section>
  );
}

type TabItemProps = {
  children: React.ReactNode;
  default?: boolean;
  label: string;
};

function TabItem({ children }: TabItemProps) {
  return <>{children}</>;
}

TabView.Item = TabItem;

export default TabView as {
  Item: typeof TabItem;
} & typeof TabView;
