import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

type SliderProps = {
  from: number;
  to: number;
  current: SharedValue<number>;
};

function Slider({ current, from, to }: SliderProps) {
  const sliderWidth = useSharedValue(0);
  const panStartValue = useSharedValue(0);

  const getOffsetX = useCallback(
    (start: number, end: number, value: number) => {
      'worklet';
      return ((value - start) / (end - start)) * sliderWidth.value;
    },
    [sliderWidth]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          panStartValue.value = current.value;
        })
        .onChange(({ translationX }) => {
          const startPosition = getOffsetX(from, to, panStartValue.value);
          const maxPosition = sliderWidth.value;
          const nextPosition = Math.min(
            Math.max(startPosition + translationX, 0),
            maxPosition
          );
          const nextValue = from + (to - from) * (nextPosition / maxPosition);
          current.value = nextValue;
        }),
    [current, from, getOffsetX, panStartValue, sliderWidth, to]
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .onEnd(({ x }) => {
          const nextValue = from + (to - from) * (x / sliderWidth.value);
          current.value = nextValue;
        })
        .hitSlop({ bottom: 10, left: 10, right: 10, top: 10 }),
    [current, from, sliderWidth, to]
  );

  const animatedThumbStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: sliderWidth.value
            ? getOffsetX(from, to, current.value)
            : 0
        }
      ]
    }),
    [from, to]
  );

  return (
    <View style={styles.sliderContainer}>
      <GestureDetector gesture={tapGesture}>
        <View
          style={styles.sliderBar}
          onLayout={e => (sliderWidth.value = e.nativeEvent.layout.width)}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.sliderThumb, animatedThumbStyle]} />
          </GestureDetector>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderBar: {
    borderRadius: 5,
    height: 10
  },
  sliderContainer: {
    justifyContent: 'center',
    width: '100%'
  },
  sliderThumb: {
    borderRadius: 25,
    height: 25,
    left: -12.5,
    position: 'absolute',
    top: -7.5,
    width: 25
  }
});

export default memo(Slider);
