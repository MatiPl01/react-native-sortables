import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle
} from 'react-native-reanimated';

import { useDragContext } from '../../contexts';

type ActiveItemDecorationProps = PropsWithChildren<{
  pressProgress: SharedValue<number>;
}>;

export default function ActiveItemDecoration({
  children,
  pressProgress
}: ActiveItemDecorationProps) {
  const {
    activationProgress,
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    inactiveItemOpacity,
    inactiveItemScale
  } = useDragContext();

  const animatedDecorationStyle = useAnimatedStyle(() => {
    const resultantProgress =
      2 * pressProgress.value - activationProgress.value;

    return {
      opacity: interpolate(
        resultantProgress,
        [-1, 0, 1],
        [inactiveItemOpacity.value, 1, activeItemOpacity.value]
      ),
      shadowColor: interpolateColor(
        resultantProgress,
        [-1, 0, 1],
        [
          'transparent',
          'transparent',
          `rgba(0, 0, 0, ${activeItemShadowOpacity.value})`
        ]
      ),
      transform: [
        {
          scale: interpolate(
            resultantProgress,
            [-1, 0, 1],
            [inactiveItemScale.value, 1, activeItemScale.value]
          )
        }
      ]
    };
  });

  return (
    <Animated.View style={[styles.grow, animatedDecorationStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grow: {
    elevation: 5,
    flexGrow: 1,
    shadowOffset: {
      height: 0,
      width: 0
    },
    shadowOpacity: 1,
    shadowRadius: 5
  }
});
