import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const INITIAL_DATA = Array.from(
  { length: 4 },
  (_, index) => `Item ${index + 1}`
);

export default function TouchableExample() {
  const [data, setData] = useState(INITIAL_DATA);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
        <Sortable.Touchable
          style={styles.deleteButton}
          onTap={() => setData(prev => prev.filter(i => i !== item))}>
          <Text style={styles.text}>Delete</Text>
        </Sortable.Touchable>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Sortable.Grid
        columnGap={10}
        columns={2}
        data={data}
        renderItem={renderItem}
        rowGap={10}
      />
      {data.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>All items deleted!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 10,
    gap: 10,
    height: 100,
    justifyContent: 'center'
  },
  container: {
    padding: 10,
    flex: 1
  },
  deleteButton: {
    backgroundColor: '#6AA67C',
    borderRadius: 10,
    padding: 8
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
