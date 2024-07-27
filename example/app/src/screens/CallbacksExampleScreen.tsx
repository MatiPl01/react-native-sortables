import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type {
  DragEndCallback,
  DragStartCallback,
  OrderChangeCallback,
  SortableGridRenderItem
} from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

import { AnimatedText } from '@/components/misc';

const CARDS = Array.from({ length: 6 }, (_, i) => ({
  key: `key${i}`,
  title: `Card ${i + 1}`
}));

function formatParams(params: { [key: string]: unknown }) {
  return JSON.stringify(params, null, 2);
}

export default function CallbacksExampleScreen() {
  const text = useSharedValue('Callback output will be displayed here');

  const onDragStart = useCallback<DragStartCallback>(
    params => {
      text.value = `onDragStart:${formatParams(params)}`;
    },
    [text]
  );

  const onDragEnd = useCallback<DragEndCallback>(
    params => {
      text.value = `onDragEnd:${formatParams(params)}`;
    },
    [text]
  );

  const onOrderChange = useCallback<OrderChangeCallback>(
    params => {
      text.value = `onOrderChange:${formatParams(params)}`;
    },
    [text]
  );

  const renderItem = useCallback<
    SortableGridRenderItem<(typeof CARDS)[number]>
  >(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
      </View>
    ),
    []
  );

  return (
    <>
      <View style={[styles.section, styles.fill]}>
        <Text style={styles.title}>Callback output</Text>
        <AnimatedText style={styles.textBox} text={text} multiline />
      </View>
      <View style={styles.section}>
        <SortableGrid
          columns={3}
          data={CARDS}
          renderItem={renderItem}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          onOrderChange={onOrderChange}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 8,
    minHeight: 80,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84
  },
  fill: {
    flex: 1
  },
  section: {
    borderColor: 'black',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12
  },
  textBox: {
    flex: 1,
    fontSize: 16
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});
