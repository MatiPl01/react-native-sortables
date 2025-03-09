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
import { usePortalContext } from '../PortalProvider';

export default function useTeleportedItemStyles(
  key: string,
  activeAnimationProgress: SharedValue<number>
): StyleProp<AnimatedStyle<ViewStyle>> {
  const { activeItemAbsolutePosition, portalOutletRef } = usePortalContext()!;
  const { activeItemKey, containerRef, itemDimensions, itemPositions } =
    useCommonValuesContext();

  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const dimensions = useDerivedValue(() => itemDimensions.value[key]);
  const dropStartTranslation = useSharedValue<Vector | null>(null);

  const absoluteX = useSharedValue<null | number>(null);
  const absoluteY = useSharedValue<null | number>(null);

  // Inactive item updater (for drop animation)
  useAnimatedReaction(
    () => ({
      activationProgress: activeAnimationProgress.value,
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
      if (!dropStartTranslation.value) {
        dropStartTranslation.value = {
          x: absoluteX.value,
          y: absoluteY.value
        };
      }

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
        return;
      }

      absoluteX.value = position.x;
      absoluteY.value = position.y;
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    const portalOutletMeasurements = measure(portalOutletRef);

    if (
      absoluteX.value === null ||
      absoluteY.value === null ||
      !portalOutletMeasurements
    ) {
      return { opacity: 0 };
    }

    const dX = portalOutletMeasurements.pageX;
    const dY = portalOutletMeasurements.pageY;

    return {
      ...dimensions.value,
      opacity: 1,
      transform: [
        { translateX: absoluteX.value - dX },
        { translateY: absoluteY.value - dY }
      ]
    };
  });

  return useMemo(() => [styles.container, animatedStyle], [animatedStyle]);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute'
  }
});
