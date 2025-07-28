import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  interpolateColor,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemDecoration(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
) {
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
    if (isActive.value || prevActiveItemKey.value === key) {
      return withTiming(0, { duration: activationAnimationDuration.value });
    }

    return interpolate(
      activationAnimationProgress.value,
      [0, 1],
      [inactiveAnimationProgress.value, 0]
    );
  });

  return useDerivedValue(() => {
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
