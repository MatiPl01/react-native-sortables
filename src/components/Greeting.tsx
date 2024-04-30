import { StyleSheet, Text, View } from 'react-native';

import { greet } from '../utils';

export default function Greeting() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{greet()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    padding: 16
  },
  text: {
    color: '#333',
    fontSize: 24
  }
});
