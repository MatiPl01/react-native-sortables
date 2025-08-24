import { StyleSheet } from 'react-native';
import Animated, { measure, useAnimatedStyle } from 'react-native-reanimated';

import type { DebugLineProps, WrappedProps } from '../../types/debug';
import { isPresent } from '../../utils';
import { useScreenDiagonal } from '../hooks';
import { useDebugContext } from '../providers/DebugProvider';

export default function DebugLine({ props }: WrappedProps<DebugLineProps>) {
  const { debugOutletRef } = useDebugContext() ?? {};
  const screenDiagonal = useScreenDiagonal();

  const animatedStyle = useAnimatedStyle(() => {
    const {
      from,
      isAbsolute,
      thickness = 3,
      to,
      type,
      visible = true,
      x,
      y
    } = props.value;

    let angle = 0,
      length,
      tX = 0,
      tY = 0;

    if (from && to) {
      length = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
      angle = Math.atan2(to.y - from.y, to.x - from.x);
      tY = from.y;
      tX = from.x;
    } else if (isPresent(x) && (type === 'vertical' || isPresent(y))) {
      length = 2 * screenDiagonal;
      angle = Math.PI / 2;
      tY = (y ?? 0) - screenDiagonal;
      tX = x;
    } else if (isPresent(y) && (type === 'horizontal' || isPresent(x))) {
      length = 2 * screenDiagonal;
      tY = y;
      tX = (x ?? 0) - screenDiagonal;
    } else {
      return { display: 'none' };
    }

    const measurements = isAbsolute
      ? debugOutletRef && measure(debugOutletRef)
      : undefined;

    return {
      display: visible ? 'flex' : 'none',
      height: thickness,
      opacity: props.value.opacity,
      transform: [
        {
          translateX:
            tX - (measurements?.pageX ?? 0) + (Math.sin(angle) * thickness) / 2
        },
        {
          translateY:
            tY - (measurements?.pageY ?? 0) + (Math.cos(angle) * thickness) / 2
        },
        { rotate: `${angle}rad` }
      ],
      width: length
    };
  }, [screenDiagonal]);

  const animatedInnerStyle = useAnimatedStyle(() => {
    const { color = 'black', style = 'dashed', thickness = 3 } = props.value;

    return {
      borderColor: color,
      borderStyle: style,
      borderWidth: thickness
    };
  });

  return (
    // A tricky way to create a dashed/dotted line (render border on both sides and
    // hide one side with overflow hidden)
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={animatedInnerStyle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    transformOrigin: '0 0'
  }
});
