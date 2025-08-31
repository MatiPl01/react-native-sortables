/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback } from 'react';
import type { ViewStyle } from 'react-native';
import type {
  AnimatedStyle,
  LayoutAnimationFunction,
  SharedValue
} from 'react-native-reanimated';
import {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { HIDDEN_X_OFFSET, isFabric } from '../../../constants';
import { useMutableValue } from '../../../integrations/reanimated';
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
 * 2. Use layout transitions for inactive items to animate their position
 * 3. Switch to transforms only for the active item when it's being dragged around
 *
 * Since Fabric updates non-layout and layout props simultaneously, it's safe
 * to switch between transforms and layout props without visual glitches.
 *
 * We still use layout props for TextInput compatibility
 * (see issue https://github.com/MatiPl01/react-native-sortables/issues/430)
 */
function useItemLayoutStyleFabric(
  position: SharedValue<null | Vector>,
  zIndex: SharedValue<number>,
  isActive: SharedValue<boolean>
) {
  const { activeItemDropped, usesAbsoluteLayout } = useCommonValuesContext();
  const transformStartPosition = useMutableValue<null | Vector>(null);

  useAnimatedReaction(
    () => ({
      active: isActive.value,
      current: position.value,
      dropped: activeItemDropped.value
    }),
    ({ active, current, dropped }) => {
      if (active) {
        transformStartPosition.value ??= current;
      } else if (dropped) {
        transformStartPosition.value = null;
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

export default function useItemLayout(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): {
  layout?: LayoutAnimationFunction;
  style: AnimatedStyle<ViewStyle>;
} {
  const {
    activeItemKey,
    activeItemPosition,
    animateLayoutOnReorderOnly,
    itemPositions,
    shouldAnimateLayout
  } = useCommonValuesContext();

  const layoutPosition = useDerivedValue(
    () => itemPositions.value[key] ?? null
  );
  const dropStartValues = useMutableValue<null | {
    position: Vector;
    progress: number;
  }>(null);

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const position = useMutableValue<null | Vector>(null);

  let layoutEnabled: SharedValue<boolean> | undefined;
  let layoutTransition: LayoutAnimationFunction | undefined;

  if (isFabric()) {
    layoutEnabled = useMutableValue(false);
    // Use layout transition instead of worklet-based animation on Fabric
    // to reduce the number of commits to the ShadowTree and improve performance
    layoutTransition = useCallback<LayoutAnimationFunction>(
      values => {
        'worklet';
        if (!layoutEnabled?.value) {
          return { animations: {}, initialValues: {} };
        }

        return {
          animations: {
            originX: withTiming(values.targetOriginX),
            originY: withTiming(values.targetOriginY)
          },
          initialValues: {
            originX: values.currentOriginX,
            originY: values.currentOriginY
          }
        };
      },
      [layoutEnabled]
    );
  }

  // Inactive item position updater
  useAnimatedReaction(
    () => ({
      activationProgress: activationAnimationProgress.value,
      active: isActive.value,
      itemPosition: layoutPosition.value
    }),
    ({ activationProgress, active, itemPosition }, prev) => {
      if (layoutEnabled) {
        layoutEnabled.value = false;
      }
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

      if (!positionChanged) {
        return;
      }

      if (
        shouldAnimateLayout.value &&
        (!animateLayoutOnReorderOnly.value || activeItemKey.value !== null)
      ) {
        if (!layoutEnabled) {
          position.value = withTiming(itemPosition);
          return;
        }
        layoutEnabled.value = true;
      }
      position.value = itemPosition;
    }
  );

  // Active item position updater
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

  return {
    layout: layoutTransition,
    style: isFabric()
      ? useItemLayoutStyleFabric(position, zIndex, isActive)
      : useItemLayoutStylePaper(position, zIndex)
  };
}
