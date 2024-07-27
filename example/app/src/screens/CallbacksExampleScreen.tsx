import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

import { AnimatedText } from '@/components/misc';

const CARDS = Array.from({ length: 6 }, (_, i) => ({
  key: i,
  title: `Card ${i + 1}`
}));

export default function CallbacksExampleScreen() {
  const text = useSharedValue('Callback output will be displayed here');

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
    <ScrollView>
      <AnimatedText text={text} />
      <View style={styles.section}>
        <SortableGrid columns={6} data={CARDS} renderItem={renderItem} />
      </View>
    </ScrollView>
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
  section: {
    borderColor: 'black',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 6,
    marginVertical: 6
  }
});
