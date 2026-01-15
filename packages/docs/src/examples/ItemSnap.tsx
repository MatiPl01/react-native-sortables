import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';
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
          value={snapEnabled}
          onValueChange={setSnapEnabled}
          trackColor={{ false: '#767577', true: '#36877F' }}
          thumbColor={snapEnabled ? '#f4f3f4' : '#f4f3f4'}
        />
      </View>
      <Sortable.Grid
        columnGap={10}
        columns={2}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
        enableActiveItemSnap={snapEnabled}
        snapOffsetX='50%'
        snapOffsetY='50%'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 10,
    height: 100,
    justifyContent: 'center'
  },
  container: {
    padding: 10,
    flex: 1
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
