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
  const { activeItemAbsolutePosition } = usePortalContext()!;
  const { portalOutletMeasurements } = usePortalOutletContext()!;
  const { containerRef, itemPositions } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const dropStartTranslation = useSharedValue<null | Vector>(null);

  // Inactive item updater (for drop animation)
  useAnimatedReaction(
    () => ({
      active: isActive.value
    }),
    ({ active }) => {
      if (!active) {
        dropStartTranslation.value = activeItemAbsolutePosition.value;
      }
    }
  );

  const absoluteItemPosition = useDerivedValue(() => {
    let absolutePosition: null | Vector = null;

    if (isActive.value) {
      absolutePosition = activeItemAbsolutePosition.value;
    } else if (dropStartTranslation.value) {
      const animate = (from: number, to: number) =>
        interpolate(activationAnimationProgress.value, [1, 0], [from, to]);
      const { x: startX, y: startY } = dropStartTranslation.value;

      const containerMeasurements = measure(containerRef);
      const itemPosition = itemPositions.value[key];

      if (!containerMeasurements || !itemPosition) {
        // This should never happen
        return null;
      }

      absolutePosition = {
        x: animate(startX, containerMeasurements.pageX + itemPosition.x),
        y: animate(startY, containerMeasurements.pageY + itemPosition.y)
      };
    }

    return absolutePosition;
  });

  const animatedStyle = useAnimatedStyle(() => {
    if (!portalOutletMeasurements.value || !absoluteItemPosition.value) {
      // This should never happen
      return { opacity: 0 };
    }

    const { pageX: outletX, pageY: outletY } = portalOutletMeasurements.value;
    const { x: itemX, y: itemY } = absoluteItemPosition.value;

    return {
      opacity: 1,
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
