import { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
        <Sortable.Touchable onTap={() => handleItemPress(item)}>
          <Sortable.Handle mode={fixed ? 'fixed' : 'draggable'}>
            <GridItem fixed={fixed} item={item} />
          </Sortable.Handle>
        </Sortable.Touchable>
      );
    },
    [fixedItems, handleItemPress]
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <View style={styles.usageSection}>
        <Text style={text.heading2}>How to use this example?</Text>
        <Text style={text.body1}>
          Press on items to make them fixed or draggable.
        </Text>
        <Text style={text.body1}>
          Drag items that aren&apos;t grayed out to see that fixed items stay in
          place.
        </Text>
      </View>
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
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: fixed ? '#555' : colors.primary }
      ]}>
      <Text style={styles.text}>{item}</Text>
    </View>
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
  },
  usageSection: {
    gap: spacing.xs,
    marginBottom: spacing.md
  }
});
