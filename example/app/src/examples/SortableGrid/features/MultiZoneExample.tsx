import { useCallback } from 'react';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { GridCard, ScrollScreen, Section } from '@/components';
import { spacing } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(12);
const COLUMNS = 4;

export default function MultiZoneExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <ScrollScreen includeNavBarHeight>
      <Sortable.MultiZoneProvider minActivationDistance={10}>
        <Section title='Section 1'>
          <Sortable.Grid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={80}
            debug
          />
        </Section>

        <Section title='Section 2'>
          <Sortable.Grid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={spacing.xs}
          />
        </Section>
      </Sortable.MultiZoneProvider>
    </ScrollScreen>
  );
}
