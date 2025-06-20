import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import type { AnimatedStyleProp, Vector } from '../../../types';
import { areVectorsDifferent } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemZIndex from './useItemZIndex';

const RELATIVE_STYLE: ViewStyle = {
  position: 'relative',
  transform: [],
  zIndex: 0
};

const HIDDEN_STYLE: ViewStyle = {
  position: 'absolute',
  transform: [{ scale: 0 }],
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
    itemPositions,
    shouldAnimateLayout,
    usesAbsoluteLayout
  } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const dropStartValues = useSharedValue<null | {
    position: Vector;
    progress: number;
  }>(null);

  const translateX = useSharedValue<null | number>(null);
  const translateY = useSharedValue<null | number>(null);

  // Inactive item updater
  useAnimatedReaction(
    () => ({
      activationProgress: activationAnimationProgress.value,
      isActive: activeItemKey.value === key,
      position: itemPositions.value[key]
    }),
    ({ activationProgress, isActive, position }, prev) => {
      if (isActive || !position) {
        dropStartValues.value = null;
        return;
      }

      if (
        translateX.value === null ||
        translateY.value === null ||
        !shouldAnimateLayout.value ||
        (animateLayoutOnReorderOnly.value &&
          activationProgress === 0 &&
          activeItemDropped.value)
      ) {
        // No animation case
        translateX.value = position.x;
        translateY.value = position.y;
      } else if (activationProgress > 0) {
        // Drop animation case
        if (
          !dropStartValues.value ||
          (prev?.position && areVectorsDifferent(prev.position, position))
        ) {
          dropStartValues.value = {
            position: {
              x: translateX.value,
              y: translateY.value
            },
            progress: activationProgress
          };
        }

        const {
          position: { x, y },
          progress
        } = dropStartValues.value;
        const animate = (from: number, to: number) =>
          interpolate(activationProgress, [progress, 0], [from, to]);

        translateX.value = animate(x, position.x);
        translateY.value = animate(y, position.y);
      } else {
        // Order change animation case
        translateX.value = withTiming(position.x);
        translateY.value = withTiming(position.y);
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
      return HIDDEN_STYLE;
    }

    return {
      position: 'absolute',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
      zIndex: zIndex.value
    };
  });
}
