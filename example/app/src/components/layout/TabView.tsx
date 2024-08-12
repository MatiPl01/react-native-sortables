import type { PropsWithChildren, ReactElement } from 'react';
import { Children, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { TabSelector } from '@/components/inputs';
import { colors, flex, spacing } from '@/theme';

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
    <Animated.View entering={FadeIn} style={flex.fill}>
      <View style={styles.tabBar}>
        <TabSelector
          selectedTab={selectedTab}
          tabs={tabsNames}
          onSelectTab={setSelectedTab}
        />
      </View>
      {childrenArray[tabsNames.indexOf(selectedTab)]}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 1
  }
});

TabView.Tab = Tab;

export default TabView;
