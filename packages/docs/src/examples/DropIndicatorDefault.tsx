import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export default function DropIndicatorDefaultExample() {
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
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
        showDropIndicator
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
    padding: 10
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
