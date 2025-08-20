import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedRef
} from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { Group, Screen } from '@/components';
import { IS_WEB } from '@/constants';
import { colors, radius, sizes, spacing, style, text } from '@/theme';

const DATA = Array.from({ length: 20 }, (_, index) => `Item ${index + 1}`);

export default function CollapsibleItemsExample() {
  const [collapsed, setCollapsed] = useState(false);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <Animated.View
        layout={LinearTransition}
        style={[styles.card, { height: collapsed ? sizes.lg : sizes.xxxl }]}>
        <Animated.Text layout={LinearTransition} style={styles.text}>
          {item}
        </Animated.Text>
      </Animated.View>
    ),
    [collapsed]
  );

  return (
    <Screen>
      <Animated.ScrollView
        contentContainerStyle={[styles.container, IS_WEB && style.webContent]}
        ref={scrollableRef}>
        <Group style={styles.group} withMargin={false} bordered center>
          <Text style={styles.title}>Above Collapsible Items</Text>
        </Group>

        <Sortable.Grid
          activeItemScale={1.05}
          autoScrollMaxOverscroll={[50, 120]}
          columnGap={10}
          data={DATA}
          overDrag='vertical'
          overflow='visible'
          renderItem={renderItem}
          rowGap={10}
          scrollableRef={scrollableRef}
          autoAdjustOffsetDuringDrag
          debug
          onActiveItemDropped={() => setCollapsed(false)}
          onDragStart={() => setCollapsed(true)}
        />

        <Group style={styles.group} withMargin={false} bordered center>
          <Text style={styles.title}>Below Collapsible Items</Text>
        </Group>
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.md,
    height: sizes.xl,
    justifyContent: 'center'
  },
  container: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 120
  },
  group: {
    height: sizes.xxl
  },
  text: {
    ...text.label2,
    color: colors.white
  },
  title: {
    ...text.subHeading2,
    marginLeft: spacing.md,
    marginTop: spacing.sm
  }
});
