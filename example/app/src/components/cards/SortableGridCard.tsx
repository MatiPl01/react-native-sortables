import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

import { useItemOrderChange } from '@/hooks';
import { colors, radius, spacing } from '@/theme';

import type { RouteCardComponent } from './RouteCard';
import RouteCard from './RouteCard';

const DATA = new Array(12).fill(null).map((_, index) => `${index + 1}`);

const ACTIVE_INDEX = 6;
const ACTIVE_ITEM = DATA[ACTIVE_INDEX];

const SortableGridCard: RouteCardComponent = props => {
  const data = useItemOrderChange(DATA, ACTIVE_INDEX);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={[styles.cell, item === ACTIVE_ITEM && styles.activeCell]}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <RouteCard {...props}>
      <SortableGrid
        columnGap={spacing.xxs}
        columns={6}
        data={data}
        dragEnabled={false}
        renderItem={renderItem}
        rowGap={spacing.xxs}
      />
    </RouteCard>
  );
};

const styles = StyleSheet.create({
  activeCell: {
    backgroundColor: colors.secondary
  },
  cell: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center'
  },
  text: {
    color: colors.background1,
    fontSize: 12,
    fontWeight: 'bold'
  }
});

export default SortableGridCard;
