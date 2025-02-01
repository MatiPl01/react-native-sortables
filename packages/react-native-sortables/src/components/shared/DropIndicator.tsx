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
  withTiming
} from 'react-native-reanimated';

import { useCommonValuesContext } from '../../providers';
import type { DropIndicatorComponentProps, Vector } from '../../types';

const DEFAULT_STYLE: ViewStyle = {
  opacity: 0
};

type DropIndicatorProps = {
  DropIndicatorComponent: ComponentType<DropIndicatorComponentProps>;
  style: ViewStyle;
};

function DropIndicator({ DropIndicatorComponent, style }: DropIndicatorProps) {
  const {
    activationProgress,
    activeItemDropped,
    indexToKey,
    itemPositions,
    keyToIndex,
    touchedItemHeight,
    touchedItemKey,
    touchedItemWidth
  } = useCommonValuesContext();

  // Clone the array in order to prevent user from mutating the internal state
  const orderedItemKeys = useDerivedValue(() => [...indexToKey.value]);

  const dropIndex = useSharedValue(0);
  const dropPosition = useSharedValue<Vector>({ x: 0, y: 0 });
  const prevTouchedItemKey = useSharedValue<null | string>(null);

  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);

  useAnimatedReaction(
    () => ({
      dropped: activeItemDropped.value,
      kToI: keyToIndex.value,
      key: touchedItemKey.value,
      positions: itemPositions.value
    }),
    ({ dropped, kToI, key, positions }) => {
      if (key !== null) {
        dropIndex.value = kToI[key] ?? 0;
        dropPosition.value = positions[key] ?? { x: 0, y: 0 };

        const update = (target: SharedValue<null | number>, value: number) => {
          if (target.value === null || prevTouchedItemKey.value === null) {
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
      }
      prevTouchedItemKey.value = key;
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = x.value;
    const translateY = y.value;

    if (translateX === null || translateY === null || activeItemDropped.value) {
      return DEFAULT_STYLE;
    }

    return {
      height: touchedItemHeight.value,
      opacity: 1,
      transform: [{ translateX }, { translateY }],
      width: touchedItemWidth.value
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <DropIndicatorComponent
        activationProgress={activationProgress}
        dropIndex={dropIndex}
        dropPosition={dropPosition}
        orderedItemKeys={orderedItemKeys}
        style={style}
        touchedItemKey={touchedItemKey}
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
