import type { PropsWithChildren, ReactElement } from 'react';
import { Children, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { TabSelector } from '@/components/inputs';
import { spacing } from '@/theme';
import { flex } from '@/theme/layout';

type TabProps = PropsWithChildren<{
  name: string;
}>;

function Tab({ children }: TabProps): ReactElement {
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOut} style={flex.fill}>
      {children}
    </Animated.View>
  );
}

type TabViewComponent = {
  (props: TabViewProps): ReactElement | null;
  Tab: typeof Tab;
};

type TabViewProps = {
  children: Array<ReactElement<TabProps>> | ReactElement<TabProps>;
};

const TabView: TabViewComponent = ({ children }: TabViewProps) => {
  const childrenArray = useMemo(
    () => Children.toArray(children) as Array<ReactElement<TabProps>>,
    [children]
  );
  const tabsNames = useMemo(
    () => childrenArray.map(child => child.props.name),
    [childrenArray]
  );

  const [selectedTab, setSelectedTab] = useState(tabsNames[0]);

  if (!selectedTab) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TabSelector
        selectedTab={selectedTab}
        tabs={tabsNames}
        onSelectTab={setSelectedTab}
      />
      {childrenArray[tabsNames.indexOf(selectedTab)]}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.md
  }
});

TabView.Tab = Tab;

export default TabView;
