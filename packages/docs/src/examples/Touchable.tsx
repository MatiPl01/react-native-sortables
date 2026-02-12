import { useCallback, useState } from 'react';
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
        {/* highlight-next-line */}
        <Sortable.Touchable
          style={styles.deleteButton}
          // highlight-next-line
          onTap={() => setData(prev => prev.filter(i => i !== item))}>
          <Text style={styles.text}>Delete</Text>
          {/* highlight-next-line */}
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
    backgroundColor: 'var(--ifm-color-primary)',
    borderRadius: 10,
    gap: 10,
    height: 100,
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    padding: 10
  },
  deleteButton: {
    backgroundColor: 'var(--ifm-color-primary-light)',
    borderRadius: 10,
    padding: 8
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    color: 'var(--ifm-color-emphasis-600)',
    fontSize: 16,
    fontStyle: 'italic'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
