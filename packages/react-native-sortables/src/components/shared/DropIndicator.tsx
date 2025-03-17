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
  style: ViewStyle;
};

function DropIndicator({ DropIndicatorComponent, style }: DropIndicatorProps) {
  const {
    activeAnimationProgress,
    activeItemDropped,
    activeItemKey,
    indexToKey,
    itemDimensions,
    itemPositions,
    keyToIndex,
    sortableKeys
  } = useCommonValuesContext();

  console.log(sortableKeys);

  // Clone the array in order to prevent user from mutating the internal state
  const orderedItemKeys = useDerivedValue(() => [...indexToKey.value]);

  const dropIndex = useSharedValue(0);
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
      positions: itemPositions.value,
      sortableKeys: sortableKeys
    }),
    ({ dropped, kToI, key, positions, sortableKeys }) => {
      if (sortableKeys.includes(key ?? '')) {
        if (key !== null) {
          dropIndex.value = kToI[key] ?? 0;
          dropPosition.value = positions[key] ?? { x: 0, y: 0 };
          dimensions.value = itemDimensions.value[key] ?? null;

          const update = (
            target: SharedValue<null | number>,
            value: number
          ) => {
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
