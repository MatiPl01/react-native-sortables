import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

const COLUMNS = 3;
const CARDS = Array.from({ length: COLUMNS }, (_, i) => ({
  key: i,
  title: `Card ${i + 1}`
}));

export default function DropIndicatorExampleScreen() {
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
      <View style={styles.section}>
        <Text style={styles.title}>Without Drop Indicator</Text>
        <SortableGrid columns={COLUMNS} data={CARDS} renderItem={renderItem} />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Default Drop Indicator</Text>
        <SortableGrid
          columns={COLUMNS}
          data={CARDS}
          renderItem={renderItem}
          showDropIndicator
        />
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
