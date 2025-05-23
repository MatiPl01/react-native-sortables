import { Alert, StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

const DATA = [
  'Happy 😀',
  'Sad 😢',
  'Angry 😡',
  'Surprised 😮',
  'Confused 😕',
  'Disappointed 😞',
  'Disgusted 😒',
  'Excited 😄',
  'Frustrated 😤',
  'Grateful 😊',
  'Hopeful 😊',
  'Joyful 😊',
  'Love 😊'
];

export default function Flex() {
  return (
    <Sortable.Flex gap={10} padding={10} customHandle dragActivationDelay={0}>
      {/* You can render anything within the Sortable.Flex component */}
      {DATA.map(item => (
        <Sortable.Handle key={item}>
          <Sortable.NewPressable
            onPress={() => {
              Alert.alert('test');
            }}>
            <View key={item} style={styles.cell}>
              <Text style={styles.text}>{item}</Text>
            </View>
          </Sortable.NewPressable>
        </Sortable.Handle>
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
    fontSize: 16,
    color: 'white'
  }
});
