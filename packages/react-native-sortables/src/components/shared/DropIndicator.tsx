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
  withTiming
} from 'react-native-reanimated';

import { useMutableValue } from '../../integrations/reanimated';
import { useCommonValuesContext, useItemDimensions } from '../../providers';
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
    activeAnimationProgress,
    activeItemDropped,
    activeItemKey,
    indexToKey,
    itemPositions,
    keyToIndex
  } = useCommonValuesContext();

  // Clone the array in order to prevent user from mutating the internal state
  const orderedItemKeys = useDerivedValue(() => [...indexToKey.value]);

  const dropIndex = useMutableValue(0);
  const dropPosition = useMutableValue<Vector>({ x: 0, y: 0 });
  const prevUpdateItemKey = useMutableValue<null | string>(null);
  const dimensions = useItemDimensions(activeItemKey);

  const x = useMutableValue<null | number>(null);
  const y = useMutableValue<null | number>(null);

  useAnimatedReaction(
    () => ({
      dropped: activeItemDropped.value,
      key: activeItemKey.value,
      kToI: keyToIndex.value,
      positions: itemPositions.value
    }),
    ({ dropped, key, kToI, positions }) => {
      if (key !== null) {
        dropIndex.value = kToI[key] ?? 0;
        dropPosition.value = positions[key] ?? { x: 0, y: 0 };

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
      opacity: 1,
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
