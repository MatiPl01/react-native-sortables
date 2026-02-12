import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);
const FIXED_ITEMS = [DATA[0], DATA[7], DATA[11]];

export default function FixedItemsExample() {
  const renderItem = useCallback(({ item }: { item: string }) => {
    const isFixed = FIXED_ITEMS.includes(item);
    return (
      <Sortable.Handle mode={isFixed ? 'fixed-order' : 'draggable'}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isFixed
                ? 'var(--ifm-color-emphasis-400)'
                : 'var(--ifm-color-primary)'
            }
          ]}>
          <Text style={styles.text}>{item}</Text>
        </View>
      </Sortable.Handle>
    );
  }, []);

  return (
    <View style={styles.container}>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
        customHandle
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
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
