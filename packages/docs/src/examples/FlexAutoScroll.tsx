import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
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
  'New Zealand',
  'Brazil',
  'Argentina',
  'Mexico',
  'Japan',
  'China',
  'India',
  'Norway',
  'Sweden',
  'Finland',
  'Denmark',
  'Ireland',
  'Belgium',
  'Austria',
  'Switzerland',
  'Croatia',
  'Serbia',
  'Turkey',
  'Egypt'
];

export default function FlexAutoScrollExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.contentContainer}
      ref={scrollableRef}
      style={styles.scrollView}>
      <Sortable.Flex
        gap={10}
        // highlight-next-line
        scrollableRef={scrollableRef} // required for auto scroll
      >
        {DATA.map(item => (
          <View key={item} style={styles.cell}>
            <Text numberOfLines={1} style={styles.text}>
              {item}
            </Text>
          </View>
        ))}
      </Sortable.Flex>
    </Animated.ScrollView>
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
  contentContainer: {
    padding: 10
  },
  scrollView: {
    height: 400 // Limit height to enable scrolling in demo
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
