import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = [
  { label: 'Poland', size: 14 },
  { label: 'Germany', size: 22 },
  { label: 'France', size: 16 },
  { label: 'Italy', size: 28 },
  { label: 'Spain', size: 14 },
  { label: 'Portugal', size: 20 },
  { label: 'Greece', size: 18 },
  { label: 'Great Britain', size: 14 },
  { label: 'United States', size: 24 },
  { label: 'Canada', size: 16 },
  { label: 'Australia', size: 20 },
  { label: 'New Zealand', size: 14 }
];

export default function FlexDifferentSizesExample() {
  return (
    <View style={styles.container}>
      <Sortable.Flex alignItems='center' gap={10}>
        {DATA.map(({ label, size }) => (
          <View key={label} style={styles.cell}>
            <Text numberOfLines={1} style={[styles.text, { fontSize: size }]}>
              {label}
            </Text>
          </View>
        ))}
      </Sortable.Flex>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    backgroundColor: 'var(--ifm-color-primary)',
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
