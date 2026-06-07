import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle
} from 'react-native-reanimated';
import Sortable, { useItemContext } from 'react-native-sortables';

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

export default function FlexCustomShadowExample() {
  return (
    <View style={styles.container}>
      <Sortable.Flex
        // Disable default shadow as we will apply our
        // box-shadow in the item component
        activeItemShadowOpacity={0}
        gap={10}>
        {DATA.map(item => (
          <FlexItem item={item} key={item} />
        ))}
      </Sortable.Flex>
    </View>
  );
}

const FlexItem = memo(function FlexItem({ item }: { item: string }) {
  const { activationAnimationProgress } = useItemContext();

  const animatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      activationAnimationProgress.value,
      [0, 1],
      ['transparent', '#1a433f']
    );
    return {
      boxShadow: `0 5px 10px ${color}`
    };
  });

  return (
    <Animated.View style={[styles.cell, animatedStyle]}>
      <Text numberOfLines={1} style={styles.text}>
        {item}
      </Text>
    </Animated.View>
  );
});

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
    padding: 16
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
