import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 2 }, (_, index) => `Item ${index + 1}`);

export default function CollapsibleItemsExample() {
  const [collapsed, setCollapsed] = useState(false);

  // TODO - fix portal case
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <Animated.View
        layout={LinearTransition.delay(40)}
        style={[styles.card, { height: collapsed ? sizes.lg : sizes.xxxl }]}>
        <Animated.Text layout={LinearTransition.delay(40)} style={styles.text}>
          {item}
        </Animated.Text>
      </Animated.View>
    ),
    [collapsed]
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        activeItemScale={1.05}
        columnGap={10}
        data={DATA}
        overDrag='vertical'
        renderItem={renderItem}
        rowGap={10}
        onActiveItemDropped={() => setCollapsed(false)}
        onDragStart={() => setCollapsed(true)}
      />
    </ScrollScreen>
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
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
