import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(3);

export default function CollapsibleItemsExample() {
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
    <ScrollScreen>
      <Sortable.Grid
        data={DATA}
        renderItem={renderItem}
        rowGap={spacing.md}
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
    height: sizes.xl,
    justifyContent: 'center'
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
