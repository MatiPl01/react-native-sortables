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
  useSharedValue
} from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useItemPosition
} from '../../providers/shared';
import type { Vector } from '../../types';

export type DropIndicatorComponentProps = {
  activationProgress: SharedValue<number>;
  activatedItemKey: SharedValue<null | string>;
  dropIndex: SharedValue<number>;
  dropPosition: SharedValue<Vector>;
  orderedItemKeys: SharedValue<Array<string>>;
  style: ViewStyle;
};

type DropIndicatorProps = {
  DropIndicatorComponent: ComponentType<DropIndicatorComponentProps>;
  style: ViewStyle;
};

function DropIndicator({ DropIndicatorComponent, style }: DropIndicatorProps) {
  const {
    activatedItemKey,
    activationProgress,
    activeItemDropped,
    indexToKey,
    itemPositions,
    keyToIndex,
    touchedItemHeight,
    touchedItemWidth
  } = useCommonValuesContext();

  // Clone the array in order to prevent user from mutating the internal state
  const orderedItemKeys = useDerivedValue(() => [...indexToKey.value]);

  const { x, y } = useItemPosition(activatedItemKey, {
    easing: Easing.out(Easing.ease),
    ignoreTouched: true
  });

  const dropIndex = useSharedValue(0);
  const dropPosition = useSharedValue<Vector>({ x: 0, y: 0 });

  useAnimatedReaction(
    () => ({
      kToI: keyToIndex.value,
      key: activatedItemKey.value,
      positions: itemPositions.value
    }),
    ({ kToI, key, positions }) => {
      if (key !== null) {
        dropIndex.value = kToI[key] ?? 0;
        dropPosition.value = positions[key] ?? { x: 0, y: 0 };
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = x.value;
    const translateY = y.value;

    if (
      (activeItemDropped.value && activationProgress.value === 0) ||
      translateX === null ||
      translateY === null
    ) {
      return { opacity: 0 };
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
        activatedItemKey={activatedItemKey}
        activationProgress={activationProgress}
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
