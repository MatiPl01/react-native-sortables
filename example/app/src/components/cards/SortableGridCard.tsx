import { useCallback } from 'react';
import type { SortableGridRenderItem } from 'react-native-sortable';
import Sortable from 'react-native-sortable';

import { GridCard } from '@/components';
import { useItemOrderChange } from '@/hooks';
import { spacing } from '@/theme';
import { getItems } from '@/utils';

import type { RouteCardComponent } from './RouteCard';
import RouteCard from './RouteCard';

const DATA = getItems(10, '');
const COLUMNS = 5;

const ACTIVE_INDEX = 5;
const ACTIVE_ITEM = DATA[ACTIVE_INDEX];

const SortableGridCard: RouteCardComponent = props => {
  const data = useItemOrderChange(DATA, ACTIVE_INDEX);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard active={item === ACTIVE_ITEM}>{item}</GridCard>,
    []
  );

  return (
    <RouteCard {...props}>
      <Sortable.Grid
        columnGap={spacing.xxs}
        columns={COLUMNS}
        data={data}
        renderItem={renderItem}
        rowGap={spacing.xxs}
        sortEnabled={false}
      />
    </RouteCard>
  );
};

export default SortableGridCard;
