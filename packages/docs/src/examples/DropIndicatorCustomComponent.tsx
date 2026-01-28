import React, { useCallback } from 'react';
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
import Sortable, { DropIndicatorComponentProps } from 'react-native-sortables';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

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

export default function DropIndicatorCustomComponentExample() {
  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={DATA}
        DropIndicatorComponent={DropIndicator}
        renderItem={renderItem}
        rowGap={10}
        showDropIndicator
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 10,
    height: 100,
    justifyContent: 'center'
  },
  container: {
    padding: 10
  },
  customIndicator: { borderStyle: 'solid' },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
