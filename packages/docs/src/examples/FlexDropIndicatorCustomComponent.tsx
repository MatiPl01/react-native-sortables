import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import type { DropIndicatorComponentProps } from 'react-native-sortables';
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

function DropIndicator({
  activeAnimationProgress,
  activeItemKey,
  dropIndex,
  orderedItemKeys,
  style
}: DropIndicatorComponentProps) {
  const itemsCount = useDerivedValue(() => orderedItemKeys.value.length);
  const indexes = useDerivedValue(() =>
    Array.from({ length: itemsCount.value }, (_, i) => i)
  );
  const colors = useDerivedValue(() =>
    Array.from({ length: itemsCount.value }, (_, i) => {
      const hue = (360 / itemsCount.value) * i;
      return `hsl(${hue}, 100%, 50%)`;
    })
  );

  const scale = useSharedValue(0);
  const colorIndex = useSharedValue(0);
  const showIndicator = useDerivedValue(
    () => activeAnimationProgress.value > 0.2 && activeItemKey.value !== null
  );

  useAnimatedReaction(
    () => ({
      count: itemsCount.value,
      index: dropIndex.value,
      show: showIndicator.value
    }),
    ({ count, index, show }, prev) => {
      if (show !== prev?.show) {
        scale.value = withSpring(+show);
      } else if (show && index !== prev?.index) {
        colorIndex.value = withTiming(index % count);
        scale.value = withSequence(
          withTiming(0.75, { duration: 100 }),
          withSpring(1)
        );
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorIndex.value,
      indexes.value,
      colors.value
    ),
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[style, styles.customIndicator, animatedStyle]} />
  );
}

export default function FlexDropIndicatorCustomComponentExample() {
  return (
    <View style={styles.container}>
      <Sortable.Flex
        DropIndicatorComponent={DropIndicator}
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
  customIndicator: { borderRadius: 9999, borderStyle: 'solid' },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
