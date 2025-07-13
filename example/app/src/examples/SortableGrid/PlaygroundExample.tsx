import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export default function PlaygroundExample() {
  const [collapsed, setCollapsed] = useState(false);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <Animated.View
        layout={LinearTransition}
        style={[styles.card, { height: collapsed ? sizes.lg : sizes.xxl }]}>
        <Animated.Text layout={LinearTransition} style={styles.text}>
          {item}
        </Animated.Text>
      </Animated.View>
    ),
    [collapsed]
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        columnGap={10}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
        debug
        onDragEnd={() => setCollapsed(false)}
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
