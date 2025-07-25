import { useRef } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  makeMutable,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import {
  type AnimatedStyleProp,
  useMutableValue
} from '../../../integrations/reanimated';
import type { Vector } from '../../../types';
import { areVectorsDifferent, mergeStyles } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemDecorationValues from './useItemDecorationValues';
import useItemZIndex from './useItemZIndex';

const RELATIVE_STYLE: ViewStyle = {
  position: 'relative'
};

const HIDDEN_STYLE: ViewStyle = {
  left: -9999,
  position: 'absolute'
};

export default function useItemStyles(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): AnimatedStyleProp {
  const {
    activeItemKey,
    activeItemPosition,
    animateLayoutOnReorderOnly,
    itemPositions,
    shouldAnimateLayout,
    usesAbsoluteLayout
  } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const layoutPosition = useDerivedValue(
    () => itemPositions.value[key] ?? null
  );
  const decoration = useItemDecorationValues(
    key,
    isActive,
    activationAnimationProgress
  );

  const positionRef = useRef<SharedValue<null | Vector>>(null);
  const dropStartValues = useMutableValue<null | {
    position: Vector;
    progress: number;
  }>(null);

  positionRef.current ??= makeMutable(
    isActive.value ? activeItemPosition.value : layoutPosition.value
  );

  const position = positionRef.current;

  // Inactive item updater
  useAnimatedReaction(
    () => ({
      activationProgress: activationAnimationProgress.value,
      active: isActive.value,
      itemPosition: layoutPosition.value
    }),
    ({ activationProgress, active, itemPosition }, prev) => {
      if (!itemPosition || active) {
        dropStartValues.value = null;
        return;
      }

      if (!position.value) {
        position.value = itemPosition;
        return;
      }

      const positionChanged =
        prev?.itemPosition &&
        areVectorsDifferent(prev.itemPosition, itemPosition);

      if (activationProgress === 0) {
        if (dropStartValues.value) {
          dropStartValues.value = null;
          position.value = itemPosition;
          return;
        }
      }
      // Set dropStartValues only if the item was previously active or if is
      // already during the drop animation and the target position changed
      else if (dropStartValues.value ? positionChanged : prev?.active) {
        dropStartValues.value = {
          position: position.value,
          progress: activationProgress
        };
      }

      if (dropStartValues.value) {
        const {
          position: { x, y },
          progress
        } = dropStartValues.value;
        const animate = (from: number, to: number) =>
          interpolate(activationProgress, [progress, 0], [from, to]);

        position.value = {
          x: animate(x, itemPosition.x),
          y: animate(y, itemPosition.y)
        };
        return;
      }

      if (!positionChanged) {
        return;
      }

      if (
        shouldAnimateLayout.value &&
        (!animateLayoutOnReorderOnly.value || activeItemKey.value !== null)
      ) {
        position.value = withTiming(itemPosition);
      } else {
        position.value = itemPosition;
      }
    }
  );

  // Active item updater
  useAnimatedReaction(
    () => ({
      active: isActive.value,
      activePosition: activeItemPosition.value
    }),
    ({ active, activePosition }) => {
      if (active && activePosition) {
        position.value = activePosition;
      }
    }
  );

  return useAnimatedStyle(() => {
    if (!usesAbsoluteLayout.value) {
      return mergeStyles(RELATIVE_STYLE, decoration.value);
    }

    if (!position.value) {
      return HIDDEN_STYLE;
    }

    return mergeStyles(
      {
        // Must use layout props to position views to ensure that TextInput
        // components work properly
        // https://github.com/MatiPl01/react-native-sortables/issues/430
        left: position.value.x,
        position: 'absolute',
        top: position.value.y,
        zIndex: zIndex.value
      },
      decoration.value
    );
  });
}
