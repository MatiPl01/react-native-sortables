import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export default function PlaygroundExample() {
  const [data, setData] = useState(DATA);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={data}
        renderItem={renderItem}
        reorderOnDrag={false}
        rowGap={10}
        strategy='swap'
        onDragEnd={params => {
          console.log(
            'item',
            params.key,
            'moved from',
            params.fromIndex,
            'to',
            params.toIndex,
            `(${params.data[params.toIndex]})`
          );
          setData(params.data.filter(item => item !== params.key));
        }}
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
