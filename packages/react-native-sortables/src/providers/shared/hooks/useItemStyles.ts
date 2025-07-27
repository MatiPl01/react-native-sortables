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

import { IS_WEB, isFabric } from '../../../constants';
import type { AnyRecord } from '../../../helperTypes';
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
function useItemStylesPaper(
  position: SharedValue<null | Vector>,
  decoration: SharedValue<AnyRecord>,
  zIndex: SharedValue<number>
) {
  const { usesAbsoluteLayout } = useCommonValuesContext();

  const layoutStyles = useAnimatedStyle(() => {
    if (!usesAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    if (!position.value) {
      return HIDDEN_STYLE;
    }

    return {
      // Must use layout props to position views to ensure that TextInput
      // components work properly
      // https://github.com/MatiPl01/react-native-sortables/issues/430
      left: position.value.x,
      position: 'absolute',
      top: position.value.y,
      zIndex: zIndex.value
    };
  });

  const nonLayoutStyles = useAnimatedStyle(() => decoration.value);

  return [layoutStyles, nonLayoutStyles];
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
function useItemStylesFabric(
  position: SharedValue<null | Vector>,
  layoutPosition: SharedValue<null | Vector>,
  decoration: SharedValue<AnyRecord>,
  zIndex: SharedValue<number>
) {
  const { activeItemDropped, usesAbsoluteLayout } = useCommonValuesContext();
  const isTransform = useMutableValue(false);

  useAnimatedReaction(
    () => ({
      current: position.value,
      dropped: activeItemDropped.value,
      layout: layoutPosition.value
    }),
    ({ current, dropped, layout }) => {
      if (layout && current && areVectorsDifferent(layout, current)) {
        // Switch to positioning via transform for every item which position
        // is being changed while one of the items is being dragged
        isTransform.value = true;
      } else if (dropped) {
        isTransform.value = false;
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
        position: 'absolute',
        zIndex: zIndex.value
      },
      isTransform.value
        ? {
            left: 0,
            top: 0,
            transform: [
              { translateX: position.value.x },
              { translateY: position.value.y }
            ]
          }
        : {
            // Must use layout props to position views to ensure that TextInput
            // components work properly
            // https://github.com/MatiPl01/react-native-sortables/issues/430
            left: position.value.x,
            top: position.value.y,
            transform: []
          },
      decoration.value
    );
  });
}

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
    shouldAnimateLayout
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

  return isFabric() || IS_WEB
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useItemStylesFabric(position, layoutPosition, decoration, zIndex)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useItemStylesPaper(position, decoration, zIndex);
}
