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

export default function FlexDropIndicatorDefaultExample() {
  return (
    <View style={styles.container}>
      <Sortable.Flex
        dropIndicatorStyle={styles.dropIndicator}
        gap={10}
        // highlight-next-line
        showDropIndicator>
        {DATA.map(item => (
          <View key={item} style={styles.cell}>
            <Text numberOfLines={1} style={styles.text}>
              {item}
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
  dropIndicator: {
    backgroundColor: 'var(--ifm-color-emphasis-200)',
    borderColor: 'var(--ifm-color-emphasis-600)',
    borderRadius: 9999,
    borderStyle: 'dashed',
    borderWidth: 2,
    flex: 1
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
