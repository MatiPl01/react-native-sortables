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

export default function FlexDropIndicatorCustomStyleExample() {
  return (
    <View style={styles.container}>
      <Sortable.Flex
        dropIndicatorStyle={styles.dropIndicator} // Custom style
        gap={10}
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
    backgroundColor: 'transparent',
    borderColor: 'var(--ifm-color-primary)',
    borderRadius: 9999,
    borderStyle: 'solid',
    borderWidth: 4
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
