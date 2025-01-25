import { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortable';
import Sortable from 'react-native-sortable';

const DATA = Array.from({ length: 4 }, (_, index) => `Item ${index + 1}`);

export default function Grid() {
  const [data, setData] = useState(DATA);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
        <Sortable.Pressable
          style={styles.deleteButton}
          onPress={() => setData(prev => prev.filter(i => i !== item))}>
          <Text style={styles.text}>Delete</Text>
        </Sortable.Pressable>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Sortable.Grid
        columns={2}
        data={data}
        renderItem={renderItem}
        rowGap={10}
        columnGap={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10
  },
  card: {
    backgroundColor: '#36877F',
    height: 100,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  },
  deleteButton: {
    backgroundColor: '#6AA67C',
    padding: 10,
    borderRadius: 10
  }
});
