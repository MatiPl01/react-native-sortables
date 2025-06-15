import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { type AnimatedStyleProp } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemZIndex from './useItemZIndex';

const RELATIVE_STYLE: ViewStyle = {
  opacity: 1,
  position: 'relative',
  transform: [],
  zIndex: 0
};

const NO_TRANSLATION_STYLE: ViewStyle = {
  ...RELATIVE_STYLE,
  opacity: 0,
  position: 'absolute',
  zIndex: -1
};

export default function useItemLayoutStyles(
  key: string,
  activationAnimationProgress: SharedValue<number>
): AnimatedStyleProp {
  const {
    activeItemDropped,
    activeItemKey,
    activeItemPosition,
    animateLayoutOnReorderOnly,
    dropAnimationDuration,
    itemPositions,
    shouldAnimateLayout,
    usesAbsoluteLayout
  } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);

  const translateX = useSharedValue<null | number>(null);
  const translateY = useSharedValue<null | number>(null);

  // Inactive item updater
  useAnimatedReaction(
    () => ({
      isActive: activeItemKey.value === key,
      position: itemPositions.value[key]
    }),
    ({ isActive, position }) => {
      if (isActive || !position) {
        return;
      }

      if (
        translateX.value === null ||
        translateY.value === null ||
        !shouldAnimateLayout.value ||
        (activeItemKey.value === null &&
          animateLayoutOnReorderOnly.value &&
          activeItemDropped.value)
      ) {
        translateX.value = position.x;
        translateY.value = position.y;
      } else {
        translateX.value = withTiming(position.x, {
          duration: dropAnimationDuration.value
        });
        translateY.value = withTiming(position.y, {
          duration: dropAnimationDuration.value
        });
      }
    }
  );

  // Active item updater
  useAnimatedReaction(
    () => ({
      isActive: activeItemKey.value === key,
      position: activeItemPosition.value
    }),
    ({ isActive, position }) => {
      if (!isActive || !position) {
        return;
      }

      translateX.value = position.x;
      translateY.value = position.y;
    }
  );

  return useAnimatedStyle(() => {
    if (!usesAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    if (translateX.value === null || translateY.value === null) {
      return NO_TRANSLATION_STYLE;
    }

    return {
      opacity: 1,
      position: 'absolute',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
      zIndex: zIndex.value
    };
  });
}
