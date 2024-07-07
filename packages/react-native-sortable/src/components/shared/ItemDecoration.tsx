import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle
} from 'react-native-reanimated';

import { useDragContext } from '../../contexts';

type ItemDecorationProps = {
  pressProgress: SharedValue<number>;
} & ViewProps;

export default function ItemDecoration({
  pressProgress,
  style,
  ...rest
}: ItemDecorationProps) {
  const {
    activationProgress,
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    inactiveItemOpacity,
    inactiveItemScale
  } = useDragContext();

  const animatedStyle = useAnimatedStyle(() => {
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
      shadowOpacity: interpolate(resultantProgress, [-1, 0, 1], [0, 0, 1]),
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
    <Animated.View
      style={[style, styles.decoration, animatedStyle]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  decoration: {
    elevation: 5,
    shadowOffset: {
      height: 0,
      width: 0
    },
    shadowRadius: 5
  }
});
