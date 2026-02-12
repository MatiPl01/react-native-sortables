import { useCallback, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 4 }, (_, index) => `Item ${index + 1}`);

export default function ItemSnapExample() {
  const [snapEnabled, setSnapEnabled] = useState(true);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.label}>Enable Snap</Text>
        <Switch
          thumbColor={snapEnabled ? '#f4f3f4' : '#f4f3f4'}
          value={snapEnabled}
          trackColor={{
            false: 'var(--ifm-color-emphasis-400)',
            true: 'var(--ifm-color-primary)'
          }}
          onValueChange={setSnapEnabled}
        />
      </View>
      <Sortable.Grid
        columnGap={10}
        columns={2}
        data={DATA}
        // highlight-next-line
        enableActiveItemSnap={snapEnabled}
        renderItem={renderItem}
        rowGap={10}
        // highlight-start
        snapOffsetX='50%'
        snapOffsetY='50%'
        // highlight-end
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: 'var(--ifm-color-primary)',
    borderRadius: 10,
    height: 100,
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    padding: 10
  },
  controls: {
    alignItems: 'center',
    backgroundColor: 'var(--ifm-color-emphasis-100)',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10
  },
  label: {
    color: 'var(--ifm-color-content)',
    fontSize: 16,
    fontWeight: '600'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
