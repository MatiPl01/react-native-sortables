import { useCallback } from 'react';
import { ScrollView } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { GridCard, Section, Stagger } from '@/components';
import { spacing, style } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(12);
const COLUMNS = 4;

export default function OrderingStrategyExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <ScrollView contentContainerStyle={style.contentContainer}>
      <Stagger ParentComponent={Sortable.Layer}>
        <Section
          description='The relative order of items is preserved. The active item is inserted into the new position.'
          title='"insert" ordering strategy'>
          <Sortable.Grid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={spacing.xs}
            strategy='insert'
            animateHeight
          />
        </Section>

        <Section
          description='The relative order of items is not preserved. The active item is swapped with the item at the new position.'
          title='"swap" ordering strategy'>
          <Sortable.Grid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={spacing.xs}
            strategy='swap'
            animateHeight
          />
        </Section>
      </Stagger>
    </ScrollView>
  );
}
