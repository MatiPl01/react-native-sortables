import { colors, text } from '@/theme';
import { Text, View, StyleSheet } from 'react-native';
import Sortable from 'react-native-sortable';

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
        <View style={styles.cell} key={item}>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </Sortable.Flex>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: '#36877F',
    borderRadius: 9999,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
