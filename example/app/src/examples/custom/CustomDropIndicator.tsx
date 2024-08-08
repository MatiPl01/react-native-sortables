import { StyleSheet } from 'react-native';
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
import type { DropIndicatorComponentProps } from 'react-native-sortable';

export default function CustomDropIndicator({
  activationProgress,
  dropIndex,
  orderedItemKeys,
  style,
  touchedItemKey
}: DropIndicatorComponentProps) {
  const itemCount = useDerivedValue(() => orderedItemKeys.value.length);
  const indexes = useDerivedValue(() =>
    Array.from({ length: itemCount.value }, (_, i) => i)
  );
  const colors = useDerivedValue(() =>
    new Array(itemCount.value).fill(null).map((_, i) => {
      const hue = (360 / itemCount.value) * i;
      return `hsl(${hue}, 100%, 50%)`;
    })
  );

  const scale = useSharedValue(0);
  const colorIndex = useSharedValue(0);
  const showIndicator = useDerivedValue(
    () => activationProgress.value > 0.2 && touchedItemKey.value !== null
  );

  useAnimatedReaction(
    () => ({
      count: itemCount.value,
      index: dropIndex.value,
      show: showIndicator.value
    }),
    ({ count, index, show }, prev) => {
      if (show !== prev?.show) {
        scale.value = withSpring(+show);
      } else if (index !== prev?.index) {
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

const styles = StyleSheet.create({
  customIndicator: {
    // Overrides default drop indicator style passed to the
    // CustomDropIndicator component in props
    borderStyle: 'solid'
  }
});
