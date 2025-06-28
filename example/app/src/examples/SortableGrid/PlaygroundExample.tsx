import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = [
  { height: 50, id: 1 },
  { height: 50, id: 2 },
  { height: 50, id: 3 },
  { height: 300, id: 4 },
  { height: 50, id: 5 }
];

export default function PlaygroundExample() {
  const renderItem = useCallback<SortableGridRenderItem<(typeof DATA)[number]>>(
    ({ item }) => (
      <View style={[styles.card, { height: item.height }]}>
        <Text style={styles.text}>{item.id}</Text>
      </View>
    ),
    []
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
        // strategy='swap'
        debug
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.md,
    height: sizes.xl,
    justifyContent: 'center'
  },
  container: {
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
