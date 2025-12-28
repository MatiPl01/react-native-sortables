import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);
// Deterministic heights for demo purposes
const HEIGHTS = [120, 80, 150, 60, 100, 130, 90, 70, 110, 140, 50, 85];

export default function DifferentItemHeightsExample() {
  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <View style={[styles.card, { height: HEIGHTS[index % HEIGHTS.length] }]}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 10,
    justifyContent: 'center'
  },
  container: {
    padding: 10
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
