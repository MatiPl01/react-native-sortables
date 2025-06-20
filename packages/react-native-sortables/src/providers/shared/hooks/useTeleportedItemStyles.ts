import { useMemo } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  measure,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import type { Vector } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { usePortalOutletContext } from '../PortalOutletProvider';
import { usePortalContext } from '../PortalProvider';
import useItemZIndex from './useItemZIndex';

export default function useTeleportedItemStyles(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): StyleProp<AnimatedStyle<ViewStyle>> {
  const { activeItemAbsolutePosition } = usePortalContext() ?? {};
  const { portalOutletMeasurements } = usePortalOutletContext() ?? {};
  const { containerRef, itemPositions } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);

  const dropStartValues = useSharedValue<null | {
    fromAbsolute: Vector;
    progress: number;
    toRelative: Vector;
  }>(null);

  // Drop start values calculation reaction
  useAnimatedReaction(
    () => ({
      active: isActive.value
    }),
    ({ active }) => {
      if (active) {
        dropStartValues.value = null;
      } else if (
        activeItemAbsolutePosition?.value &&
        itemPositions.value[key]
      ) {
        dropStartValues.value = {
          fromAbsolute: activeItemAbsolutePosition.value,
          progress: activationAnimationProgress.value,
          toRelative: itemPositions.value[key]
        };
      }
    }
  );

  const absoluteItemPosition = useDerivedValue(() => {
    let absolutePosition: null | Vector = null;

    if (isActive.value) {
      absolutePosition = activeItemAbsolutePosition?.value ?? null;
    } else if (dropStartValues.value) {
      const measurements = measure(containerRef);
      if (!measurements) {
        return null;
      }

      const { fromAbsolute, progress, toRelative } = dropStartValues.value;

      const animate = (source: number, target: number) =>
        interpolate(
          activationAnimationProgress.value,
          [progress, 0],
          [source, target]
        );

      absolutePosition = {
        x: animate(fromAbsolute.x, measurements.pageX + toRelative.x),
        y: animate(fromAbsolute.y, measurements.pageY + toRelative.y)
      };
    }

    return absolutePosition;
  });

  // Drop start values updater on target position change
  useAnimatedReaction(
    () => itemPositions.value[key],
    position => {
      if (
        isActive.value ||
        activationAnimationProgress.value === 0 ||
        !position ||
        !absoluteItemPosition.value
      ) {
        return;
      }

      dropStartValues.value = {
        fromAbsolute: absoluteItemPosition.value,
        progress: activationAnimationProgress.value,
        toRelative: position
      };
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!portalOutletMeasurements?.value || !absoluteItemPosition.value) {
      // This should never happen
      return { display: 'none' };
    }

    const { pageX: outletX, pageY: outletY } = portalOutletMeasurements.value;
    const { x: itemX, y: itemY } = absoluteItemPosition.value;

    return {
      display: 'flex',
      transform: [
        { translateX: itemX - outletX },
        { translateY: itemY - outletY }
      ],
      zIndex: zIndex.value
    };
  });

  return useMemo(() => [styles.container, animatedStyle], [animatedStyle]);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute'
  }
});
