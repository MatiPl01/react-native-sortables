import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useAnimatableStyle, useAnimatableValue } from '../../hooks';
import type { Animatable, Maybe, Vector } from '../../types';
import { isPresent } from '../../utils';
import { useScreenDiagonal } from '../hooks';

export type DebugLineProps = {
  visible?: Animatable<boolean>;
  color?: Animatable<ViewStyle['borderColor']>;
  thickness?: Animatable<number>;
  style?: Animatable<ViewStyle['borderStyle']>;
  opacity?: Animatable<number>;
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
);

export default function DebugLine({
  color = 'black',
  from: from_,
  opacity = 1,
  style = 'dashed',
  thickness = 3,
  to: to_,
  visible: visible_,
  x: x_,
  y: y_
}: DebugLineProps) {
  const screenDiagonal = useScreenDiagonal();

  const visibleValue = useAnimatableValue(visible_);
  const fromValue = useAnimatableValue(from_);
  const toValue = useAnimatableValue(to_);
  const xValue = useAnimatableValue(x_);
  const yValue = useAnimatableValue(y_);

  const animatedStyle = useAnimatedStyle(() => {
    let visible = visibleValue.value ?? true;
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
    } else {
      visible = false;
    }

    return {
      display: visible ? 'flex' : 'none',
      transform: [
        { translateX: tX },
        { translateY: tY },
        { rotate: `${angle}rad` }
      ],
      width: length
    };
  }, [screenDiagonal]);

  const animatedInnerStyle = useAnimatableStyle({
    borderColor: color,
    borderStyle: style,
    borderWidth: thickness
  });

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
      <Animated.View style={animatedInnerStyle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'absolute'
  }
});
