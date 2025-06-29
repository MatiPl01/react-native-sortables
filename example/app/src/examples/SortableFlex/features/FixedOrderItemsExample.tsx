import { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, spacing, text } from '@/theme';
import { getCategories } from '@/utils';

const DATA = getCategories(12);

const INITIAL_FIXED_ITEMS = new Set([DATA[1]!, DATA[5]!, DATA[6]!, DATA[11]!]);

export default function FixedOrderItemsExample() {
  const [fixedItems, setFixedItems] =
    useState<Set<string>>(INITIAL_FIXED_ITEMS);

  const handleItemPress = useCallback((item: string) => {
    setFixedItems(oldItems => {
      const newItems = new Set(oldItems);
      if (newItems.has(item)) {
        newItems.delete(item);
      } else {
        newItems.add(item);
      }
      return newItems;
    });
  }, []);

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <View style={styles.usageSection}>
        <Text style={text.heading2}>How to use this example?</Text>
        <Text style={text.body1}>
          Press on items to make them fixed or draggable.
        </Text>
        <Text style={text.body1}>
          Drag items that aren&apos;t grayed out to see that fixed items stay in
          the same ordinal position (index).
        </Text>
      </View>
      <Sortable.Flex columnGap={10} rowGap={10} customHandle>
        {DATA.map(item => (
          <FlexItem
            fixed={fixedItems.has(item)}
            item={item}
            key={item}
            onTap={handleItemPress}
          />
        ))}
      </Sortable.Flex>
    </ScrollScreen>
  );
}

type FlexItemProps = {
  item: string;
  fixed: boolean;
  onTap: (item: string) => void;
};

const FlexItem = memo(function FlexItem({ fixed, item, onTap }: FlexItemProps) {
  return (
    <Sortable.Touchable key={item} onTap={() => onTap(item)}>
      <Sortable.Handle mode={fixed ? 'fixed-order' : 'draggable'}>
        <View
          style={[
            styles.card,
            { backgroundColor: fixed ? '#555' : colors.primary }
          ]}>
          <Text style={styles.text}>{item}</Text>
        </View>
      </Sortable.Handle>
    </Sortable.Touchable>
  );
});

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.full,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
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
