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
  'Canada'
];

export default function FlexCustomHandleExample() {
  return (
    <View style={styles.container}>
      <Sortable.Flex
        gap={10}
        // highlight-next-line
        customHandle // must be set to use a custom handle
      >
        {DATA.map(item => (
          <View key={item} style={styles.card}>
            <Text numberOfLines={1} style={styles.text}>
              {item}
            </Text>
            {/* Wraps the handle component */}
            {/* highlight-next-line */}
            <Sortable.Handle>
              <View pointerEvents='none' style={styles.handle}>
                <Text style={styles.handleText}>⋮⋮</Text>
              </View>
              {/* highlight-next-line */}
            </Sortable.Handle>
          </View>
        ))}
      </Sortable.Flex>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: 'var(--ifm-color-primary)',
    borderRadius: 9999,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  container: {
    padding: 10
  },
  handle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 5,
    height: 24,
    justifyContent: 'center',
    width: 22
  },
  handleText: {
    color: 'white',
    fontWeight: 'bold'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
