import { StyleSheet, Text } from 'react-native';
import { SortableFlex } from 'react-native-sortable';

import { useItemOrderChange } from '@/hooks';
import { colors, radius, spacing } from '@/theme';

import type { RouteCardComponent } from './RouteCard';
import RouteCard from './RouteCard';

const DATA = [
  'sports',
  'history',
  'science',
  'economics',
  'politics',
  'art',
  'music',
  'literature',
  'geography'
];

const ACTIVE_INDEX = 2;
const ACTIVE_ITEM = DATA[ACTIVE_INDEX];

const SortableFlexCard: RouteCardComponent = props => {
  const data = useItemOrderChange(DATA, ACTIVE_INDEX);

  return (
    <RouteCard {...props}>
      <SortableFlex dragEnabled={false} style={styles.container}>
        {data.map(item => (
          <Text
            key={item}
            style={[styles.cell, item === ACTIVE_ITEM && styles.activeCell]}>
            {item}
          </Text>
        ))}
      </SortableFlex>
    </RouteCard>
  );
};

const styles = StyleSheet.create({
  activeCell: {
    backgroundColor: colors.secondary
  },
  cell: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    color: colors.background1,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  container: {
    columnGap: spacing.xs,
    rowGap: spacing.xxs
  }
});

export default SortableFlexCard;
