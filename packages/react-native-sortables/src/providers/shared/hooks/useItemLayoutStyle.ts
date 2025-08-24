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

import { HIDDEN_X_OFFSET, IS_WEB, isFabric } from '../../../constants';
import {
  type AnimatedStyleProp,
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
function useItemLayoutStylePaper(
  position: SharedValue<null | Vector>,
  zIndex: SharedValue<number>
) {
  const { usesAbsoluteLayout } = useCommonValuesContext();

  return useAnimatedStyle(() => {
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
function useItemLayoutStyleFabric(
  position: SharedValue<null | Vector>,
  zIndex: SharedValue<number>
) {
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

  return useAnimatedStyle(() => {
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

export default function useItemLayoutStyle(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): AnimatedStyleProp {
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
      itemPosition: layoutPosition.value,
      shouldAnimate: shouldAnimateLayout.value
    }),
    ({ activationProgress, active, itemPosition, shouldAnimate }, prev) => {
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
        areVectorsDifferent(prev.itemPosition, itemPosition, 1);

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

      if (!positionChanged && shouldAnimate === prev?.shouldAnimate) {
        return;
      }

      if (
        shouldAnimate &&
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
      useItemLayoutStyleFabric(position, zIndex)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useItemLayoutStylePaper(position, zIndex);
}
