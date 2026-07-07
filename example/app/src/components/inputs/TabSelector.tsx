import { useCallback, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { colors, flex, radius, spacing } from '@/theme';
import { typedMemo } from '@/utils';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

type TabSelectorProps<T> = {
  tabs: Readonly<Array<T>>;
  selectedTab: T;
  onSelectTab: (tab: T) => void;
};

export default function TabSelector<T extends number | string>({
  onSelectTab,
  selectedTab,
  tabs
}: TabSelectorProps<T>) {
  // Width is plain React-state layout, not an animated reanimated `width`:
  // animating a layout prop while this bar mounts raced the grid's own layout
  // commit and hit a debug-only Yoga assert on the New Architecture (RN 0.86).
  const [tabWidth, setTabWidth] = useState(0);
  const selectedIndex = Math.max(0, tabs.indexOf(selectedTab));

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: tabWidth > 0 ? 1 : 0,
    transform: [{ translateX: withTiming(tabWidth * selectedIndex) }]
  }));

  const handleMeasureWidth = useCallback((width: number) => {
    setTabWidth(prev => (width > prev ? width : prev));
  }, []);

  const tabWidthStyle: ViewStyle = tabWidth === 0 ? {} : { width: tabWidth };

  return (
    <View style={flex.center}>
      <View style={styles.tabBar}>
        <Animated.View
          style={[
            styles.selectedTabIndicator,
            tabWidthStyle,
            animatedIndicatorStyle
          ]}
        />
        {tabs.map(tab => (
          <Tab
            isSelected={tab === selectedTab}
            key={tab}
            style={tabWidthStyle}
            tab={tab}
            onMeasureWidth={handleMeasureWidth}
            onSelectTab={onSelectTab}
          />
        ))}
      </View>
    </View>
  );
}

type TabProps<T> = {
  isSelected: boolean;
  tab: T;
  style: StyleProp<ViewStyle>;
  onSelectTab: (tab: T) => void;
  onMeasureWidth: (width: number) => void;
};

const Tab = typedMemo(function Tab<T extends number | string>({
  isSelected,
  onMeasureWidth,
  onSelectTab,
  style,
  tab
}: TabProps<T>) {
  const animationProgress = useDerivedValue(() => withTiming(+isSelected));

  const animatedTabTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      animationProgress.value,
      [0, 1],
      [colors.foreground1, colors.white]
    )
  }));

  return (
    <AnimatedTouchableOpacity
      key={tab}
      style={[styles.tab, style]}
      onPress={() => onSelectTab(tab)}
      onLayout={({ nativeEvent: { layout } }) => {
        onMeasureWidth(layout.width);
      }}>
      <Animated.Text style={[styles.tabText, animatedTabTextStyle]}>
        {tab}
      </Animated.Text>
    </AnimatedTouchableOpacity>
  );
});

const styles = StyleSheet.create({
  selectedTabIndicator: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: '100%',
    position: 'absolute'
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBar: {
    backgroundColor: colors.background1,
    borderRadius: radius.full,
    flexDirection: 'row'
  },
  tabText: {
    color: colors.foreground1,
    fontWeight: 'bold',
    padding: spacing.sm
  }
});
