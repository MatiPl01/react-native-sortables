import type { ViewProps } from 'react-native';
import { Platform, StyleSheet, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { useCommonValuesContext } from '../../providers';
import { IS_WEB } from '../../constants';

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
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    dragActivationDuration,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale,
    itemsStyleOverride,
    prevTouchedItemKey
  } = useCommonValuesContext();

  const adjustedInactiveProgress = useDerivedValue(() => {
    if (isBeingActivated.value || prevTouchedItemKey.value === key) {
      return withTiming(0, { duration: dragActivationDuration.value });
    }

    return interpolate(
      pressProgress.value,
      [0, 1],
      [inactiveAnimationProgress.value, 0]
    );
  });

  const animatedStyle = useAnimatedStyle(() => {
    const progress = pressProgress.value;
    const zeroProgressOpacity = interpolate(
      adjustedInactiveProgress.value,
      [0, 1],
      [1, inactiveItemOpacity.value]
    );
    const zeroProgressScale = interpolate(
      adjustedInactiveProgress.value,
      [0, 1],
      [1, inactiveItemScale.value]
    );

    const shadowColor = interpolateColor(
      progress,
      [0, 1],
      ['transparent', `rgba(0, 0, 0, ${activeItemShadowOpacity.value})`]
    );

    const shadow = IS_WEB
      ? { filter: `drop-shadow(0px 0px 5px ${shadowColor})` }
      : { shadowColor };

    return {
      ...shadow,
      opacity: interpolate(
        progress,
        [0, 1],
        [zeroProgressOpacity, activeItemOpacity.value]
      ),
      transform: [
        {
          scale: interpolate(
            progress,
            [0, 1],
            [zeroProgressScale, activeItemScale.value]
          )
        }
      ],
      ...itemsStyleOverride.value
    };
  });

  return <Animated.View style={[styles.decoration, animatedStyle]} {...rest} />;
}

const styles = StyleSheet.create({
  decoration: Platform.select<ViewStyle>({
    android: {
      elevation: 5
    },
    native: {
      shadowOffset: {
        height: 0,
        width: 0
      },
      shadowOpacity: 1,
      shadowRadius: 5
    },
    default: {}
  })
});
