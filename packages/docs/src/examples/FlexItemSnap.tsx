import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
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

export default function FlexItemSnapExample() {
  const [snapEnabled, setSnapEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.label}>Enable Snap</Text>
        <Switch
          thumbColor='#f4f3f4'
          value={snapEnabled}
          trackColor={{
            false: 'var(--ifm-color-emphasis-400)',
            true: 'var(--ifm-color-primary)'
          }}
          onValueChange={setSnapEnabled}
        />
      </View>
      <Sortable.Flex
        enableActiveItemSnap={snapEnabled}
        gap={10}
        snapOffsetX='50%'
        snapOffsetY='50%'>
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
    flex: 1,
    padding: 10
  },
  controls: {
    alignItems: 'center',
    backgroundColor: 'var(--ifm-color-emphasis-100)',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10
  },
  label: {
    color: 'var(--ifm-color-content)',
    fontSize: 16,
    fontWeight: '600'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
