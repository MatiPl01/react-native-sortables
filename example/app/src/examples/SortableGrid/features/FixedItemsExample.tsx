import { memo, useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

const INITIAL_FIXED_ITEMS = new Set(['Item 1', 'Item 5', 'Item 12']);

export default function FixedItemsExample() {
  const [fixedItems, setFixedItems] =
    useState<Set<string>>(INITIAL_FIXED_ITEMS);

  const handleItemPress = useCallback(
    (item: string) => {
      if (fixedItems.has(item)) {
        fixedItems.delete(item);
      } else {
        fixedItems.add(item);
      }
      setFixedItems(new Set(fixedItems));
    },
    [fixedItems]
  );

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => {
      const fixed = fixedItems.has(item);

      return (
        <Sortable.Pressable onPress={() => handleItemPress(item)}>
          <Sortable.Handle mode={fixed ? 'fixed' : 'draggable'}>
            <GridItem fixed={fixed} item={item} />
          </Sortable.Handle>
        </Sortable.Pressable>
      );
    },
    [fixedItems, handleItemPress]
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
        customHandle
      />
    </ScrollScreen>
  );
}

type GridItemProps = {
  item: string;
  fixed: boolean;
};

const GridItem = memo(function GridItem({ fixed, item }: GridItemProps) {
  const progress = useDerivedValue(() => withTiming(+fixed));

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.primary, '#555']
    )
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Text style={styles.text}>{item}</Text>
    </Animated.View>
  );
});

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
