import { useCallback } from 'react';
import { ScrollView } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

import { Group } from '@/components';
import { GridCard } from '@/components/items';
import { getItems } from '@/utils';

const DATA = getItems(10);
const COLUMNS = 5;

export default function DropIndicatorExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <ScrollView>
      <Group>
        <SortableGrid
          columns={COLUMNS}
          data={DATA}
          renderItem={renderItem}
          rowGap={20}
          showDropIndicator
        />
      </Group>
    </ScrollView>
  );
}
