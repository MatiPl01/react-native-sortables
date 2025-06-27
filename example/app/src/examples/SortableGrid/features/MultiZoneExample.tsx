import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
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
            rowGap={50}
            debug
          />
        </Section>

        <Section title='Section 2'>
          <Sortable.BaseZone style={styles.zone} />
        </Section>
      </Sortable.MultiZoneProvider>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  zone: {
    height: 100
  }
});
