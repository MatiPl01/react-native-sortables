import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { colors, text } from '@/theme';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

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
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <Animated.ScrollView
      ref={scrollableRef}
      contentContainerStyle={{ padding: 20 }}>
      <Sortable.Flex gap={10} paddingTop={40}>
        {/* You can render anything within the Sortable.Flex component */}
        {DATA.map(item => (
          <View key={item} style={styles.cell}>
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
      </Sortable.Flex>
    </Animated.ScrollView>
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
