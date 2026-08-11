import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const INITIAL_DATA = [
  'Poland',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Portugal',
  'Greece',
  'Canada'
];

export default function FlexTouchableExample() {
  const [data, setData] = useState(INITIAL_DATA);

  return (
    <View style={styles.container}>
      <Sortable.Flex
        gap={10}
        // highlight-next-line
        onDragEnd={({ order }) => setData(order(data))}>
        {data.map(item => (
          <View key={item} style={styles.card}>
            <Text numberOfLines={1} style={styles.text}>
              {item}
            </Text>
            {/* highlight-next-line */}
            <Sortable.Touchable
              style={styles.deleteButton}
              // highlight-next-line
              onTap={() => setData(prev => prev.filter(i => i !== item))}>
              <Text style={styles.text}>✕</Text>
              {/* highlight-next-line */}
            </Sortable.Touchable>
          </View>
        ))}
      </Sortable.Flex>
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
    borderRadius: 9999,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  container: {
    flex: 1,
    padding: 10
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 9999,
    height: 22,
    justifyContent: 'center',
    width: 22
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
