import { StyleSheet } from 'react-native';
import Animated, { measure, useAnimatedStyle } from 'react-native-reanimated';

import type { DebugRectProps, WrappedProps } from '../../types/debug';
import { isPresent } from '../../utils';
import { useScreenDiagonal } from '../hooks';
import { useDebugContext } from '../providers/DebugProvider';

export default function DebugRect({ props }: WrappedProps<DebugRectProps>) {
  const { debugOutletRef } = useDebugContext() ?? {};
  const screenDiagonal = useScreenDiagonal();

  const animatedStyle = useAnimatedStyle(() => {
    let { height = 0, width = 0 } = props.value;
    const {
      borderColor = 'black',
      borderStyle = 'dashed',
      borderWidth = 2,
      from,
      isAbsolute,
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

    const measurements = isAbsolute
      ? debugOutletRef && measure(debugOutletRef)
      : undefined;

    return {
      borderColor,
      borderStyle,
      borderWidth,
      display: visible ? 'flex' : 'none',
      height,
      transform: [
        { translateX: tX - (measurements?.pageX ?? 0) },
        { translateY: tY - (measurements?.pageY ?? 0) }
      ],
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
    pointerEvents: 'none',
    position: 'absolute'
  }
});
