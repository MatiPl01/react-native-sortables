import { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

const INITIAL_FIXED_ITEMS = new Set(['Item 1', 'Item 5', 'Item 12']);
const INITIAL_DATA = DATA.map(title => ({
  fixed: INITIAL_FIXED_ITEMS.has(title),
  title
}));

type Item = {
  fixed: boolean;
  title: string;
};

export default function FixedOrderItemsExample() {
  const [data, setData] = useState<Array<Item>>(INITIAL_DATA);

  const handleItemPress = useCallback((title: string) => {
    setData(oldItems => {
      const newItems = [...oldItems];
      const index = newItems.findIndex(item => item.title === title);
      newItems[index] = {
        ...newItems[index]!,
        fixed: !newItems[index]!.fixed
      };
      return newItems;
    });
  }, []);

  const renderItem = useCallback<SortableGridRenderItem<Item>>(
    ({ item: { fixed, title } }) => (
      <GridItem fixed={fixed} title={title} onTap={handleItemPress} />
    ),
    [handleItemPress]
  );

  const keyExtractor = useCallback((item: Item) => item.title, []);

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
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        rowGap={10}
        customHandle
      />
    </ScrollScreen>
  );
}

type GridItemProps = {
  title: string;
  fixed: boolean;
  onTap: (item: string) => void;
};

const GridItem = memo(function GridItem({
  fixed,
  onTap,
  title
}: GridItemProps) {
  return (
    <Sortable.Touchable onTap={() => onTap(title)}>
      <Sortable.Handle mode={fixed ? 'fixed-order' : 'draggable'}>
        <View
          style={[
            styles.card,
            { backgroundColor: fixed ? '#555' : colors.primary }
          ]}>
          <Text style={styles.text}>{title}</Text>
        </View>
      </Sortable.Handle>
    </Sortable.Touchable>
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
