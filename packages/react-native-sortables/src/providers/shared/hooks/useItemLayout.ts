import { useRef } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  makeMutable,
  useAnimatedReaction,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { HIDDEN_X_OFFSET, IS_WEB, isFabric } from '../../../constants';
import {
  interpolateVector,
  useAnimatedDebounce,
  useMutableValue
} from '../../../integrations/reanimated';
import type { Vector } from '../../../types';
import { areVectorsDifferent } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemZIndex from './useItemZIndex';

const RELATIVE_STYLE: ViewStyle = {
  position: 'relative'
};

const HIDDEN_STYLE: ViewStyle = {
  left: HIDDEN_X_OFFSET,
  position: 'absolute'
};

/**
 * Handles item positioning for Paper (old React Native architecture).
 *
 * On Paper, we can safely use layout props (top/left) for positioning because:
 * - Child onLayout callbacks are typically not triggered when parent position changes
 * - This allows for efficient animation without performance issues
 * - TextInput components work properly with layout-based positioning
 *
 * We must use layout props instead of transforms to ensure TextInput components
 * work correctly (see issue https://github.com/MatiPl01/react-native-sortables/issues/430)
 */
function useItemLayoutPaper(
  position: SharedValue<null | Vector>,
  zIndex: SharedValue<number>
): SharedValue<ViewStyle> {
  const { usesAbsoluteLayout } = useCommonValuesContext();

  return useDerivedValue(() => {
    if (!usesAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    if (!position.value) {
      return HIDDEN_STYLE;
    }

    return {
      left: position.value.x,
      position: 'absolute',
      top: position.value.y,
      zIndex: zIndex.value
    };
  });
}

/**
 * Handles item positioning for Fabric (new React Native architecture).
 *
 * On Fabric, there's a performance issue where any change to parent layout
 * triggers child onLayout callbacks, causing numerous calls from C++ to JS
 * and significant performance loss. This is especially problematic when one
 * of the items is being dragged around.
 *
 * To solve this, we use a hybrid approach:
 * 1. Use layout props (top/left) when items are not being animated
 * 2. Switch to transforms during active animations to avoid triggering onLayout
 * 3. Switch back to layout props when animation completes
 *
 * Since Fabric updates non-layout and layout props simultaneously, it's safe
 * to switch between transforms and layout props without visual glitches.
 *
 * We still use layout props for TextInput compatibility
 * (see issue https://github.com/MatiPl01/react-native-sortables/issues/430)
 * but minimize their use during animations for better performance.
 */
function useItemLayoutFabric(
  position: SharedValue<null | Vector>,
  zIndex: SharedValue<number>
): SharedValue<ViewStyle> {
  const { activeItemDropped, usesAbsoluteLayout } = useCommonValuesContext();
  const transformStartPosition = useMutableValue<null | Vector>(null);
  const debounce = useAnimatedDebounce();

  useAnimatedReaction(
    () => ({ current: position.value, dropped: activeItemDropped.value }),
    ({ current, dropped }) => {
      transformStartPosition.value ??= current;
      if (dropped) {
        debounce.schedule(() => {
          transformStartPosition.value = null;
        }, 50);
      }
    }
  );

  return useDerivedValue(() => {
    if (!usesAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    if (!position.value) {
      return HIDDEN_STYLE;
    }

    const startPosition = transformStartPosition.value;

    return {
      position: 'absolute',
      zIndex: zIndex.value,
      ...(startPosition
        ? {
            left: startPosition.x,
            top: startPosition.y,
            transform: [
              { translateX: position.value.x - startPosition.x },
              { translateY: position.value.y - startPosition.y }
            ]
          }
        : {
            left: position.value.x,
            top: position.value.y,
            transform: []
          })
    };
  });
}

export default function useItemLayout(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): SharedValue<ViewStyle> {
  const {
    activeItemKey,
    activeItemPosition,
    animateLayoutOnReorderOnly,
    itemPositions,
    shouldAnimateLayout
  } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const layoutPosition = useDerivedValue(
    () => itemPositions.value[key] ?? null
  );

  const positionRef = useRef<SharedValue<null | Vector>>(null);
  const interpolationStartValues = useMutableValue<null | {
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
      active: isActive.value,
      itemPosition: layoutPosition.value,
      progress: activationAnimationProgress.value
    }),
    ({ active, itemPosition, progress }, prev) => {
      console.log('???', key, active, itemPosition, progress);
      if (!itemPosition || active) {
        interpolationStartValues.value = null;
        return;
      }

      if (!position.value) {
        position.value = itemPosition;
        return;
      }

      const positionChanged =
        prev?.itemPosition &&
        areVectorsDifferent(prev.itemPosition, itemPosition, 1);

      if (progress === 0) {
        // interpolationStartValues value is not set when the reduced motion
        // is enabled as the progress value changes immediately from 1 to 0
        // and the second if branch below is never entered
        if (interpolationStartValues.value || prev?.active) {
          interpolationStartValues.value = null;
          position.value = itemPosition;
          return;
        }
      }
      // Set dropStartValues only if the item was previously active or if is
      // already during the drop animation and the target position changed
      else if (
        interpolationStartValues.value ? positionChanged : prev?.active
      ) {
        interpolationStartValues.value = {
          position: position.value,
          progress
        };
      }

      if (interpolationStartValues.value) {
        const { position: startPosition, progress: startProgress } =
          interpolationStartValues.value;
        const currentProgress = interpolate(
          progress,
          [startProgress, 0],
          [0, 1]
        );
        position.value = interpolateVector(
          currentProgress,
          startPosition,
          itemPosition
        );
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

  return isFabric() || IS_WEB
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useItemLayoutFabric(position, zIndex)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useItemLayoutPaper(position, zIndex);
}
