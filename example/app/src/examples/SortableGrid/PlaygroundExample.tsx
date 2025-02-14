import { useCallback, useState } from 'react';
import { Button, StyleSheet, Text } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 6 }, (_, index) => `Item ${index + 1}`);

export default function PlaygroundExample() {
  const [data, setData] = useState(DATA);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <Sortable.Pressable
        style={styles.card}
        onPress={() => {
          setData(prev => prev.filter(it => it !== item));
        }}>
        <Text style={styles.text}>{item}</Text>
      </Sortable.Pressable>
    ),
    []
  );

  return (
    <ScrollScreen style={styles.container}>
      <Sortable.Grid
        columnGap={10}
        data={data}
        itemEntering={null}
        itemExiting={null}
        itemsLayoutTransitionMode='reorder'
        renderItem={renderItem}
        rowGap={10}
        onDragEnd={({ data: newData }) => setData(newData)}
      />
      <Button
        title='Add item'
        onPress={() =>
          setData(prev => [
            ...prev,
            `Item ${Math.max(0, ...data.map(d => +d.split(' ')[1]!)) + 1}`
          ])
        }
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
