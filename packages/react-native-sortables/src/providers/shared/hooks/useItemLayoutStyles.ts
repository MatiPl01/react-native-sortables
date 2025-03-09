import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../../constants';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemZIndex from './useItemZIndex';

const RELATIVE_STYLE: ViewStyle = {
  left: undefined,
  opacity: 1,
  position: 'relative',
  top: undefined,
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
): StyleProp<AnimatedStyle<ViewStyle>> {
  const {
    activeItemKey,
    activeItemPosition,
    animateLayoutOnReorderOnly,
    canSwitchToAbsoluteLayout,
    dropAnimationDuration,
    itemPositions
  } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const isReleased = useSharedValue(true);
  const hasActivationProgress = useDerivedValue(
    () => activationAnimationProgress.value > 0
  );

  const translateX = useSharedValue<null | number>(null);
  const translateY = useSharedValue<null | number>(null);
  const layoutX = useSharedValue<null | number>(null);
  const layoutY = useSharedValue<null | number>(null);

  // Inactive item updater
  useAnimatedReaction(
    () => ({
      canSwitchToAbsolute: canSwitchToAbsoluteLayout.value,
      hasProgress: hasActivationProgress.value,
      isActive: activeItemKey.value === key,
      position: itemPositions.value[key]
    }),
    ({ canSwitchToAbsolute, hasProgress, isActive, position }) => {
      if (!canSwitchToAbsolute) {
        // This affects all items rendered during the initial render when
        // the absolute layout is not yet enabled. All of these items have
        // no translation at the beginning and layoutX and layoutY are
        // corresponding to their render position.
        translateX.value = 0;
        translateY.value = 0;
        return;
      }

      if (isActive || !position) {
        // This reaction doesn't update position of the active item.
        return;
      }

      if (hasProgress && layoutX.value !== null && layoutY.value !== null) {
        // When the item is not active and has non-zero press progress,
        // it must have been dragged and released. In this case, we want
        // to animate the translation to the final position.
        if (!isReleased.value) {
          // This prevents cancellation of the animation when this reaction
          // is triggered multiple times.
          isReleased.value = true;
          translateX.value = withTiming(position.x - (layoutX.value ?? 0), {
            duration: dropAnimationDuration.value
          });
          translateY.value = withTiming(position.y - (layoutY.value ?? 0), {
            duration: dropAnimationDuration.value
          });
        }
      } else {
        if (translateX.value === null || translateY.value === null) {
          // This is the case that happens for new items added to the sortable
          // component after the absolute layout is enabled. In this case,
          // we have to set translation instead of top/left to the item's
          // position, as the initial render position of the item is the
          // top left corner of the container and we don't want to animate
          // it from this position to its correct position when rendered.
          translateX.value = position.x;
          translateY.value = position.y;
        }

        if (
          !animateLayoutOnReorderOnly.value ||
          activeItemKey.value !== null ||
          layoutX.value === null ||
          layoutY.value === null
        ) {
          layoutX.value = position.x - (translateX.value ?? 0);
          layoutY.value = position.y - (translateY.value ?? 0);
        } else {
          translateX.value = position.x - (layoutX.value ?? 0);
          translateY.value = position.y - (layoutY.value ?? 0);
        }
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

      // This updates the translation of the active item.
      isReleased.value = false;
      translateX.value = position.x - (layoutX.value ?? 0);
      translateY.value = position.y - (layoutY.value ?? 0);
    }
  );

  const animatedTranslationStyle = useAnimatedStyle(() => {
    if (
      !canSwitchToAbsoluteLayout.value &&
      (layoutX.value === null || layoutY.value === null)
    ) {
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

  const animatedLayoutStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return EMPTY_OBJECT;
    }

    return {
      left: layoutX.value,
      top: layoutY.value
    };
  });

  return useMemo(
    () => [animatedTranslationStyle, animatedLayoutStyle],
    [animatedLayoutStyle, animatedTranslationStyle]
  );
}
