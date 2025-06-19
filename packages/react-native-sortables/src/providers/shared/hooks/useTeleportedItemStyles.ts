import { useMemo } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  measure,
  useAnimatedReaction,
  useAnimatedStyle,
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
  const { activeItemAbsolutePosition } = usePortalContext()!;
  const { portalOutletMeasurements } = usePortalOutletContext()!;
  const { activeItemKey, containerRef, itemPositions } =
    useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const dropStartTranslation = useSharedValue<null | Vector>(null);

  const absoluteX = useSharedValue<null | number>(null);
  const absoluteY = useSharedValue<null | number>(null);

  // Inactive item updater (for drop animation)
  useAnimatedReaction(
    () => ({
      activationProgress: activationAnimationProgress.value,
      active: isActive.value,
      position: itemPositions.value[key]
    }),
    ({ activationProgress, active, position }) => {
      if (
        active ||
        !position ||
        !activationProgress ||
        absoluteX.value === null ||
        absoluteY.value === null
      ) {
        dropStartTranslation.value = null;
        return;
      }

      const containerMeasurements = measure(containerRef);
      if (!containerMeasurements) {
        return;
      }

      // Drop animation
      dropStartTranslation.value ??= {
        x: absoluteX.value,
        y: absoluteY.value
      };

      const animate = (from: number, to: number) =>
        interpolate(activationProgress, [1, 0], [from, to]);

      const { x, y } = dropStartTranslation.value;
      absoluteX.value = animate(x, containerMeasurements.pageX + position.x);
      absoluteY.value = animate(y, containerMeasurements.pageY + position.y);
    }
  );

  // Active item updater
  useAnimatedReaction(
    () => ({
      active: activeItemKey.value === key,
      position: activeItemAbsolutePosition.value
    }),
    ({ active, position }) => {
      if (!active || !position) {
        console.log('no position');
        return;
      }

      absoluteX.value = position.x;
      absoluteY.value = position.y;
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!portalOutletMeasurements.value) {
      // This should never happen
      return { opacity: 0 };
    }

    const { pageX, pageY } = portalOutletMeasurements.value;
    const absX = absoluteX.value ?? activeItemAbsolutePosition.value?.x ?? 0;
    const absY = absoluteY.value ?? activeItemAbsolutePosition.value?.y ?? 0;

    return {
      opacity: 1,
      transform: [{ translateX: absX - pageX }, { translateY: absY - pageY }],
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
