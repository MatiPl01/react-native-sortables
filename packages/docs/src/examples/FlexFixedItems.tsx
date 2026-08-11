import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = [
  'Poland',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Portugal',
  'Greece',
  'Great Britain',
  'United States',
  'Canada',
  'Australia',
  'New Zealand'
];
const FIXED_ITEMS = new Set([DATA[0], DATA[7], DATA[11]]);

export default function FlexFixedItemsExample() {
  const renderItem = useCallback((item: string) => {
    const isFixed = FIXED_ITEMS.has(item);

    return (
      <Sortable.Handle key={item} mode={isFixed ? 'fixed-order' : 'draggable'}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isFixed
                ? 'var(--ifm-color-emphasis-400)'
                : 'var(--ifm-color-primary)'
            }
          ]}>
          <Text numberOfLines={1} style={styles.text}>
            {item}
          </Text>
        </View>
      </Sortable.Handle>
    );
  }, []);

  return (
    <View style={styles.container}>
      <Sortable.Flex gap={10} customHandle>
        {DATA.map(renderItem)}
      </Sortable.Flex>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 9999,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  container: {
    padding: 10
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
