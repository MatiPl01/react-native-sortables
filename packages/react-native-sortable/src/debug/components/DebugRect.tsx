import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { Maybe, Vector } from '../../types';
import { isPresent } from '../../utils';
import { useScreenDiagonal } from '../hooks';
import type { WrappedProps } from '../types';

export type DebugRectProps = {
  backgroundOpacity?: number;
  visible?: boolean;
} & (
  | {
      from: Maybe<Vector>;
      to: Maybe<Vector>;
      x?: never;
      y?: never;
      width?: never;
      height?: never;
      positionOrigin?: never;
    }
  | {
      x: Maybe<number>;
      y: Maybe<number>;
      from?: never;
      to?: never;
      width: Maybe<number>;
      height: Maybe<number>;
      positionOrigin?: `${'left' | 'right'} ${'bottom' | 'top'}`;
    }
  | {
      x: Maybe<number>;
      y?: never;
      from?: never;
      to?: never;
      width: Maybe<number>;
      height?: never;
      positionOrigin?: `${'left' | 'right'}`;
    }
  | {
      x?: never;
      y: Maybe<number>;
      from?: never;
      to?: never;
      width?: never;
      height: Maybe<number>;
      positionOrigin?: `${'bottom' | 'top'}`;
    }
) &
  Pick<
    ViewStyle,
    'backgroundColor' | 'borderColor' | 'borderStyle' | 'borderWidth'
  >;

export default function DebugRect({ props }: WrappedProps<DebugRectProps>) {
  const screenDiagonal = useScreenDiagonal();

  const animatedStyle = useAnimatedStyle(() => {
    let { height = 0, width = 0 } = props.value;
    const {
      borderColor = 'black',
      borderStyle = 'dashed',
      borderWidth = 2,
      from,
      positionOrigin: origin,
      to,
      visible = true,
      x,
      y
    } = props.value;
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
      return { display: 'none' };
    }

    if (origin) {
      const origins = origin.split(' ');
      if (origins.includes('right')) {
        tX -= width ?? 0;
      }
      if (origins.includes('bottom')) {
        tY -= height ?? 0;
      }
    }

    return {
      borderColor,
      borderStyle,
      borderWidth,
      display: visible ? 'flex' : 'none',
      height,
      transform: [{ translateX: tX }, { translateY: tY }],
      width
    };
  }, []);

  const animatedInnerStyle = useAnimatedStyle(() => {
    const { backgroundColor = 'black', backgroundOpacity = 0.5 } = props.value;

    return {
      backgroundColor,
      opacity: backgroundOpacity
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedInnerStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute'
  }
});
