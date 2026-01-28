import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export default function DropIndicatorCustomStyleExample() {
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
        dropIndicatorStyle={styles.dropIndicator} // Custom style
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
  dropIndicator: {
    backgroundColor: 'rgba(54, 135, 127, 0.5)',
    borderColor: '#36877f',
    borderStyle: 'solid',
    borderWidth: 5
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
