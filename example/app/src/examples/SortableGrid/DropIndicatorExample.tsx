import { useCallback } from 'react';
import { ScrollView } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

import { GridCard, Section, Stagger } from '@/components';
import { CustomDropIndicator } from '@/examples/custom';
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
      <Stagger>
        <Section title='Without drop indicator'>
          <SortableGrid
            columnGap={6}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={6}
          />
        </Section>

        <Section title='With default drop indicator'>
          <SortableGrid
            columnGap={6}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={6}
            showDropIndicator
          />
        </Section>

        <Section
          description='Looks better without inactive item opacity, so inactiveItemOpacity is set to 1 in this example'
          title='With custom drop indicator component'>
          <SortableGrid
            columnGap={6}
            columns={COLUMNS}
            data={DATA}
            DropIndicatorComponent={CustomDropIndicator}
            inactiveItemOpacity={1}
            renderItem={renderItem}
            rowGap={6}
            showDropIndicator
          />
        </Section>
      </Stagger>
    </ScrollView>
  );
}
