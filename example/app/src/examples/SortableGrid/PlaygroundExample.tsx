import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { GridCard, ScrollScreen } from '@/components';
import { spacing } from '@/theme';

const DATA = Array.from({ length: 4 }, (_, index) => `Item ${index + 1}`);

export default function PlaygroundExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ index, item }) => <GridCard height={(index + 1) * 100}>{item}</GridCard>,
    []
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        columnGap={10}
        data={DATA}
        enableActiveItemSnap={false}
        renderItem={renderItem}
        rowGap={10}
        debug
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md
  }
});
