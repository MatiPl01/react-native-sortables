import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useAnimatableStyle, useAnimatableValue } from '../../hooks';
import type { Animatable, Maybe, Vector } from '../../types';
import { isPresent } from '../../utils';
import { useScreenDiagonal } from '../hooks';

export type DebugRectProps = {
  backgroundOpacity?: number;
  visible?: Animatable<boolean>;
} & (
  | {
      from: Animatable<Maybe<Vector>>;
      to: Animatable<Maybe<Vector>>;
      x?: never;
      y?: never;
      width?: never;
      height?: never;
      positionOrigin?: never;
    }
  | {
      x: Animatable<Maybe<number>>;
      y: Animatable<Maybe<number>>;
      from?: never;
      to?: never;
      width: Animatable<Maybe<number>>;
      height: Animatable<Maybe<number>>;
      positionOrigin?: `${'left' | 'right'} ${'bottom' | 'top'}`;
    }
  | {
      x: Animatable<Maybe<number>>;
      y?: never;
      from?: never;
      to?: never;
      width: Animatable<Maybe<number>>;
      height?: never;
      positionOrigin?: `${'left' | 'right'}`;
    }
  | {
      x?: never;
      y: Animatable<Maybe<number>>;
      from?: never;
      to?: never;
      width?: never;
      height: Animatable<Maybe<number>>;
      positionOrigin?: `${'bottom' | 'top'}`;
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
  positionOrigin: positionOrigin_,
  to: to_,
  visible: _visible = true,
  width: _width,
  x: x_,
  y: y_
}: DebugRectProps) {
  const screenDiagonal = useScreenDiagonal();

  const visibleValue = useAnimatableValue(_visible);
  const fromValue = useAnimatableValue(from_);
  const toValue = useAnimatableValue(to_);
  const xValue = useAnimatableValue(x_);
  const yValue = useAnimatableValue(y_);
  const widthValue = useAnimatableValue(_width);
  const heightValue = useAnimatableValue(_height);
  const positionOrigin = useAnimatableValue(positionOrigin_);

  const animatedStyle = useAnimatedStyle(() => {
    let visible = visibleValue.value ?? true;
    const from = fromValue.value;
    const to = toValue.value;
    const x = xValue.value;
    const y = yValue.value;
    const origin = positionOrigin.value;

    let width = widthValue.value ?? 0;
    let height = heightValue.value ?? 0;
    let tX = 0,
      tY = 0;

    if (from && to) {
      tX = Math.min(from.x, to.x);
      tY = Math.min(from.y, to.y);
      width = Math.abs(to.x - from.x);
      height = Math.abs(to.y - from.y);
    } else if (isPresent(x) && isPresent(y)) {
      tX = x;
      tY = y;
    } else if (isPresent(x)) {
      tX = x;
      tY = -screenDiagonal;
      height = 3 * screenDiagonal;
    } else if (isPresent(y)) {
      tX = -screenDiagonal;
      tY = y;
      width = 3 * screenDiagonal;
    } else {
      visible = false;
    }

    if (origin) {
      const origins = origin.split(' ');
      if (origins.includes('right')) {
        tX -= width;
      }
      if (origins.includes('bottom')) {
        tY -= height;
      }
    }

    return {
      display: visible ? 'flex' : 'none',
      height,
      transform: [{ translateX: tX }, { translateY: tY }],
      width
    };
  }, []);

  const animatedBorderStyle = useAnimatableStyle({
    borderColor,
    borderStyle,
    borderWidth
  });

  const animatedInnerStyle = useAnimatableStyle({
    backgroundColor,
    opacity: backgroundOpacity
  });

  return (
    <Animated.View
      style={[styles.container, animatedBorderStyle, animatedStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedInnerStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute'
  }
});
