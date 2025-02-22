import type { ViewProps, ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import { useCommonValuesContext } from '../../providers';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';

type ItemDecorationProps = {
  isActive: SharedValue<boolean>;
  activationAnimationProgress: SharedValue<number>;
  onLayout: NonNullable<ViewProps['onLayout']>;
  itemKey: string;
} & ViewProps;

export default function ItemDecoration({
  activationAnimationProgress,
  isActive,
  itemKey: key,
  ...rest
}: ItemDecorationProps) {
  const {
    activationAnimationDuration,
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale,
    itemsOverridesStyle,
    prevActiveItemKey
  } = useCommonValuesContext();

  const adjustedInactiveProgress = useDerivedValue(() => {
    if (isActive.value || prevActiveItemKey.value === key) {
      return withTiming(0, { duration: activationAnimationDuration.value });
    }

    return interpolate(
      activationAnimationProgress.value,
      [0, 1],
      [inactiveAnimationProgress.value, 0]
    );
  });

  const animatedStyle = useAnimatedStyle(() => {
    const progress = activationAnimationProgress.value;
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
      ]
    };
  });

  return (
    <AnimatedOnLayoutView
      {...rest}
      style={[styles.decoration, animatedStyle, itemsOverridesStyle]}
    />
  );
}

const styles = StyleSheet.create({
  decoration: Platform.select<ViewStyle>({
    android: {
      elevation: 5
    },
    default: {},
    native: {
      shadowOffset: {
        height: 0,
        width: 0
      },
      shadowOpacity: 1,
      shadowRadius: 5
    }
  })
});
