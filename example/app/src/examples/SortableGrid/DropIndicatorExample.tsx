import { useCallback } from 'react';
import { ScrollView } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortable';
import { SortableGrid, SortableLayer } from 'react-native-sortable';

import { GridCard, Section, Stagger } from '@/components';
import { CustomDropIndicator } from '@/examples/custom';
import { spacing } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(8);
const COLUMNS = 4;

export default function DropIndicatorExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <ScrollView>
      <Stagger ParentComponent={SortableLayer}>
        <Section title='Without drop indicator'>
          <SortableGrid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={spacing.xs}
          />
        </Section>

        <Section title='With default drop indicator'>
          <SortableGrid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={spacing.xs}
            showDropIndicator
          />
        </Section>

        <Section
          description='Looks better without inactive item opacity, so inactiveItemOpacity is set to 1 in this example'
          title='With custom drop indicator component'>
          <SortableGrid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            DropIndicatorComponent={CustomDropIndicator}
            inactiveItemOpacity={1}
            renderItem={renderItem}
            rowGap={spacing.xs}
            showDropIndicator
          />
        </Section>
      </Stagger>
    </ScrollView>
  );
}
