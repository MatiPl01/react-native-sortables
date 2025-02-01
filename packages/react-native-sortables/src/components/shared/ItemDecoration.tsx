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
  isBeingActivated: SharedValue<boolean>;
  pressProgress: SharedValue<number>;
  onLayout?: ViewProps['onLayout'];
  itemKey: string;
} & ViewProps;

export default function ItemDecoration({
  isBeingActivated,
  itemKey: key,
  pressProgress,
  ...rest
}: ItemDecorationProps) {
  const {
    activeItemDropped,
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale,
    itemsStyleOverride,
    prevTouchedItemKey
  } = useCommonValuesContext();

  const resultingProgress = useDerivedValue(() => {
    if (isBeingActivated.value) {
      if (activeItemDropped.value) {
        return pressProgress.value;
      }

      return interpolate(
        pressProgress.value,
        [0, 1],
        [-inactiveAnimationProgress.value, 1]
      );
    }

    if (pressProgress.value > 0) {
      if (prevTouchedItemKey.value === key) {
        return pressProgress.value;
      }

      return interpolate(
        pressProgress.value,
        [0, 1],
        [-inactiveAnimationProgress.value, 1]
      );
    }

    return -inactiveAnimationProgress.value;
  });

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
      ],
      ...itemsStyleOverride.value
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
