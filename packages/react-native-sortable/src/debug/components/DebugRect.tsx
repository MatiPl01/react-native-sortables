import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useAnimatableValue } from '../../hooks';
import type { Animatable, Vector } from '../../types';
import { useScreenDiagonal } from '../hooks';

type DebugRectProps = {
  backgroundOpacity?: number;
} & (
  | {
      from: Animatable<Vector>;
      to: Animatable<Vector>;
      x?: never;
      y?: never;
      width?: never;
      height?: never;
    }
  | {
      x: Animatable<number>;
      y: Animatable<number>;
      from?: never;
      to?: never;
      width: Animatable<number>;
      height: Animatable<number>;
    }
  | {
      x: Animatable<number>;
      y?: never;
      from?: never;
      to?: never;
      width: Animatable<number>;
      height?: never;
    }
  | {
      x?: never;
      y: Animatable<number>;
      from?: never;
      to?: never;
      width?: never;
      height: Animatable<number>;
    }
) &
  Pick<
    ViewStyle,
    'backgroundColor' | 'borderColor' | 'borderStyle' | 'borderWidth'
  >;

export default function DebugRect({
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  backgroundOpacity = 0.5,
  borderColor = 'black',
  borderStyle = 'dashed',
  borderWidth = 2,
  from: from_,
  height: _height,
  to: to_,
  width: _width,
  x: x_,
  y: y_
}: DebugRectProps) {
  const screenDiagonal = useScreenDiagonal();

  const fromValue = useAnimatableValue(from_);
  const toValue = useAnimatableValue(to_);
  const xValue = useAnimatableValue(x_);
  const yValue = useAnimatableValue(y_);
  const widthValue = useAnimatableValue(_width);
  const heightValue = useAnimatableValue(_height);

  const animatedStyle = useAnimatedStyle(() => {
    const from = fromValue.value;
    const to = toValue.value;
    const x = xValue.value;
    const y = yValue.value;

    let width = widthValue.value;
    let height = heightValue.value;
    let tX = 0,
      tY = 0;

    if (from && to) {
      tX = Math.min(from.x, to.x);
      tY = Math.min(from.y, to.y);
      width = Math.abs(to.x - from.x);
      height = Math.abs(to.y - from.y);
    } else if (x !== undefined && y !== undefined) {
      tX = x;
      tY = y;
    } else if (x !== undefined) {
      tX = x;
      tY = -screenDiagonal;
      height = 3 * screenDiagonal;
    } else if (y !== undefined) {
      tX = -screenDiagonal;
      tY = y;
      width = 3 * screenDiagonal;
    }

    return {
      height,
      transform: [{ translateX: x ?? tX }, { translateY: y ?? tY }],
      width
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor,
          borderStyle,
          borderWidth,
          transformOrigin: '0 0'
        },
        animatedStyle
      ]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor, opacity: backgroundOpacity }
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute'
  }
});
