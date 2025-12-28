import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 4 }, (_, index) => `Item ${index + 1}`);

export default function CustomHandleExample() {
  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
        {/* Wraps the handle component */}
        <Sortable.Handle>
          <View style={styles.handle}>
            <Text style={styles.handleText}>::</Text>
          </View>
        </Sortable.Handle>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Sortable.Grid
        activeItemScale={1.05}
        columns={1}
        data={DATA}
        overDrag='vertical'
        renderItem={renderItem}
        rowGap={10}
        customHandle // must be set to use a custom handle
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 24
  },
  container: {
    padding: 16
  },
  text: {
    color: 'white',
    flex: 1,
    fontWeight: 'bold'
  },
  handle: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5
  },
  handleText: {
    color: 'white',
    fontWeight: 'bold'
  }
});
