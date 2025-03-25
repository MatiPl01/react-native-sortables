import type { ComponentType } from 'react';
import { memo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { useCommonValuesContext } from '../../providers';
import type {
  Dimensions,
  DropIndicatorComponentProps,
  Vector
} from '../../types';

const DEFAULT_STYLE: ViewStyle = {
  opacity: 0
};

type DropIndicatorProps = {
  DropIndicatorComponent: ComponentType<DropIndicatorComponentProps>;
  fadeDropIndicatorOnSnap: boolean;
  style: ViewStyle;
};

function DropIndicator({ DropIndicatorComponent, fadeDropIndicatorOnSnap, style }: DropIndicatorProps) {
  const {
    activeAnimationProgress,
    activeItemDropped,
    activeItemKey,
    indexToKey,
    itemDimensions,
    itemPositions,
    keyToIndex
  } = useCommonValuesContext();

  // Clone the array in order to prevent user from mutating the internal state
  const orderedItemKeys = useDerivedValue(() => [...indexToKey.value]);

  const dropIndex = useSharedValue(0);
  const opacity = useSharedValue(1);
  const dropPosition = useSharedValue<Vector>({ x: 0, y: 0 });
  const prevUpdateItemKey = useSharedValue<null | string>(null);
  const dimensions = useSharedValue<Dimensions | null>(null);

  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);

  useAnimatedReaction(
    () => ({
      dropped: activeItemDropped.value,
      kToI: keyToIndex.value,
      key: activeItemKey.value,
      positions: itemPositions.value
    }),
    ({ dropped, kToI, key, positions }) => {
      if (key !== null) {
        opacity.value = 1;
        dropIndex.value = kToI[key] ?? 0;
        dropPosition.value = positions[key] ?? { x: 0, y: 0 };
        dimensions.value = itemDimensions.value[key] ?? null;

        const update = (target: SharedValue<null | number>, value: number) => {
          if (target.value === null || prevUpdateItemKey.value === null) {
            target.value = value;
          } else {
            target.value = withTiming(value, {
              easing: Easing.out(Easing.ease)
            });
          }
        };

        update(x, dropPosition.value.x);
        update(y, dropPosition.value.y);
      } else if (dropped) {
        x.value = null;
        y.value = null;
      } else if (fadeDropIndicatorOnSnap) {
        // Fade out indicator when snapping to position
        opacity.value = withSpring(0);
      }
      prevUpdateItemKey.value = key;
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = x.value;
    const translateY = y.value;

    if (translateX === null || translateY === null || activeItemDropped.value) {
      return DEFAULT_STYLE;
    }

    return {
      ...dimensions.value,
      opacity: opacity.value,
      transform: [{ translateX }, { translateY }]
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <DropIndicatorComponent
        activeAnimationProgress={activeAnimationProgress}
        activeItemKey={activeItemKey}
        dropIndex={dropIndex}
        dropPosition={dropPosition}
        orderedItemKeys={orderedItemKeys}
        style={style}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute'
  }
});

export default memo(DropIndicator);
