import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated';

import { useCommonValuesContext } from '../../providers';

type ItemDecorationProps = {
  isTouched: SharedValue<boolean>;
  pressProgress: SharedValue<number>;
  onLayout?: ViewProps['onLayout'];
} & ViewProps;

export default function ItemDecoration({
  isTouched,
  pressProgress,
  ...rest
}: ItemDecorationProps) {
  const {
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale
  } = useCommonValuesContext();

  const resultingProgress = useDerivedValue(() =>
    isTouched.value || pressProgress.value > 0
      ? pressProgress.value
      : -inactiveAnimationProgress.value
  );

  const animatedStyle = useAnimatedStyle(() => {
    const progress = resultingProgress.value;

    return {
      opacity: interpolate(
        progress,
        [-1, 0, 1],
        [inactiveItemOpacity.value, 1, activeItemOpacity.value]
      ),
      shadowColor: interpolateColor(
        progress,
        [-1, 0, 1],
        [
          'transparent',
          'transparent',
          `rgba(0, 0, 0, ${activeItemShadowOpacity.value})`
        ]
      ),
      shadowOpacity: interpolate(progress, [-1, 0, 1], [0, 0, 1]),
      transform: [
        {
          scale: interpolate(
            progress,
            [-1, 0, 1],
            [inactiveItemScale.value, 1, activeItemScale.value]
          )
        }
      ]
    };
  });

  return <Animated.View style={[styles.decoration, animatedStyle]} {...rest} />;
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
