import { StyleSheet } from 'react-native';
import Sortable from 'react-native-sortable';

import { FlexCell } from '@/components/items';
import { useItemOrderChange } from '@/hooks';
import { spacing } from '@/theme';
import { getCategories } from '@/utils';

import type { RouteCardComponent } from './RouteCard';
import RouteCard from './RouteCard';

const DATA = getCategories(10);

const ACTIVE_INDEX = 2;
const ACTIVE_ITEM = DATA[ACTIVE_INDEX];

const SortableFlexCard: RouteCardComponent = props => {
  const data = useItemOrderChange(DATA, ACTIVE_INDEX);

  return (
    <RouteCard {...props}>
      <Sortable.Flex sortEnabled={false} style={styles.container}>
        {data.map(item => (
          <FlexCell active={item === ACTIVE_ITEM} key={item}>
            {item}
          </FlexCell>
        ))}
      </Sortable.Flex>
    </RouteCard>
  );
};

const styles = StyleSheet.create({
  container: {
    columnGap: spacing.xs,
    rowGap: spacing.xxs
  }
});

export default SortableFlexCard;
