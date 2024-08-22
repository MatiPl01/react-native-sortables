import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useAnimatableValue } from '../../hooks';
import type { Animatable, Maybe, Vector } from '../../types';
import { isPresent } from '../../utils';
import { useScreenDiagonal } from '../hooks';

type DebugLineProps = {
  color?: ViewStyle['borderColor'];
  thickness?: number;
  style?: ViewStyle['borderStyle'];
} & (
  | {
      from: Animatable<Maybe<Vector>>;
      to: Animatable<Maybe<Vector>>;
      x?: never;
      y?: never;
    }
  | {
      x: Animatable<Maybe<number>>;
      y?: never;
      from?: never;
      to?: never;
    }
  | {
      x?: never;
      y: Animatable<Maybe<number>>;
      from?: never;
      to?: never;
    }
) &
  Pick<ViewStyle, 'opacity'>;

export default function DebugLine({
  color = 'black',
  from: from_,
  opacity = 1,
  style = 'dashed',
  thickness = 3,
  to: to_,
  x: x_,
  y: y_
}: DebugLineProps) {
  const screenDiagonal = useScreenDiagonal();

  const fromValue = useAnimatableValue(from_);
  const toValue = useAnimatableValue(to_);
  const xValue = useAnimatableValue(x_);
  const yValue = useAnimatableValue(y_);

  const animatedStyle = useAnimatedStyle(() => {
    const from = fromValue.value;
    const to = toValue.value;
    const x = xValue.value;
    const y = yValue.value;

    let angle = 0,
      length,
      tX = 0,
      tY = 0;

    if (from && to) {
      length = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
      angle = Math.atan2(to.y - from.y, to.x - from.x);
      tY = from.y;
      tX = from.x;
    } else if (isPresent(x)) {
      length = 3 * screenDiagonal;
      angle = Math.PI / 2;
      tY = -screenDiagonal;
      tX = x;
    } else if (isPresent(y)) {
      length = 3 * screenDiagonal;
      tY = y;
      tX = -screenDiagonal;
    }

    return {
      transform: [
        { translateX: tX },
        { translateY: tY },
        { rotate: `${angle}rad` }
      ],
      width: length
    };
  }, [screenDiagonal]);

  return (
    // A tricky way to create a dashed/dotted line (render border on both sides and
    // hide one side with overflow hidden)
    <Animated.View
      style={[
        styles.container,
        {
          height: thickness,
          marginTop: -thickness / 2,
          opacity,
          transformOrigin: '0 0'
        },
        animatedStyle
      ]}>
      <View
        style={{
          borderColor: color,
          borderStyle: style,
          borderWidth: thickness
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'absolute'
  }
});
