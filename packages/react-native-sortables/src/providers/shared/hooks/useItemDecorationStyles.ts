import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import type { AnimatedStyleProp } from '../../../types';
import { ItemPortalState } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';

const TELEPORTED_ITEM_STYLE: ViewStyle = {
  maxHeight: 0,
  opacity: 0,
  ...Platform.select({
    android: {
      elevation: 0
    },
    default: {},
    native: {
      shadowOpacity: 0
    }
  })
};

const NOT_TELEPORTED_ITEM_STYLE: ViewStyle = {
  maxHeight: 9999 // 'auto' doesn't trigger onLayout on web/android
};

export default function useItemDecorationStyles(
  itemKey: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>,
  portalState?: SharedValue<ItemPortalState>
): AnimatedStyleProp {
  const {
    activationAnimationDuration,
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale,
    prevActiveItemKey
  } = useCommonValuesContext();

  const adjustedInactiveProgress = useDerivedValue(() => {
    if (portalState?.value === ItemPortalState.TELEPORTED) {
      return 0;
    }

    if (isActive.value || prevActiveItemKey.value === itemKey) {
      return withTiming(0, { duration: activationAnimationDuration.value });
    }

    return interpolate(
      activationAnimationProgress.value,
      [0, 1],
      [inactiveAnimationProgress.value, 0]
    );
  });

  const animatedStyle = useAnimatedStyle(() => {
    if (portalState?.value === ItemPortalState.TELEPORTED) {
      return TELEPORTED_ITEM_STYLE;
    }

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
      interpolate(progress, [0, 1], [0, activeItemShadowOpacity.value]),
      [0, 1],
      ['transparent', 'black']
    );

    const shadow = IS_WEB
      ? { filter: `drop-shadow(0px 0px 5px ${shadowColor})` }
      : { shadowColor };

    return {
      ...NOT_TELEPORTED_ITEM_STYLE,
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

  return useMemo(() => [styles.decoration, animatedStyle], [animatedStyle]);
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
