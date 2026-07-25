import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  interpolateColor,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { IS_ANDROID, IS_WEB } from '../../../constants';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemDecoration(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): SharedValue<ViewStyle> {
  const {
    activationAnimationDuration,
    activeItemBroughtToFront,
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale,
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

  // Ramp the "picked up" progress in when the item is actually brought to front
  // (the first drag move), so the scale/shadow animate up smoothly even if the
  // activation timing already finished during a long hold. Gating the raw
  // progress alone would make it jump 0 -> 1 in a single frame in that case.
  const broughtToFrontProgress = useDerivedValue(() =>
    activeItemBroughtToFront.value
      ? withTiming(1, { duration: activationAnimationDuration.value })
      : 0
  );

  return useDerivedValue<ViewStyle>(() => {
    // Apply the "picked up" scale/shadow only once the item is actually dragged,
    // not on a bare long press (otherwise a native context menu taking over the
    // gesture makes the item scale up and then back down). The drop animation
    // still runs via activationAnimationProgress falling back to 0.
    const progress =
      broughtToFrontProgress.value * activationAnimationProgress.value;
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

    let shadow;
    if (!IS_ANDROID) {
      const shadowColor = interpolateColor(
        interpolate(progress, [0, 1], [0, activeItemShadowOpacity.value]),
        [0, 1],
        ['transparent', 'black']
      );
      shadow = IS_WEB
        ? { filter: `drop-shadow(0px 0px 5px ${shadowColor})` }
        : { shadowColor };
    }

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
}
