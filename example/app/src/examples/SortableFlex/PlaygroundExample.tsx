import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortable';

import { colors, text } from '@/theme';

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

export default function Flex() {
  return (
    <Sortable.Flex gap={10} padding={10}>
      {/* You can render anything within the Sortable.Flex component */}
      {DATA.map(item => (
        <View key={item} style={styles.cell}>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </Sortable.Flex>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 9999,
    justifyContent: 'center',
    padding: 10
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
