import type { ComponentType } from 'react';
import { memo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import {
  useDragContext,
  useItemPosition,
  useMeasurementsContext,
  usePositionsContext
} from '../../contexts/shared/providers';
import type { Vector } from '../../types';

export type DropIndicatorComponentProps = {
  activationProgress: SharedValue<number>;
  touchedItemKey: SharedValue<null | string>;
  dropIndex: SharedValue<number>;
  dropPosition: SharedValue<Vector>;
};

type DropIndicatorProps = {
  DropIndicatorComponent: ComponentType<DropIndicatorComponentProps>;
  style?: ViewStyle;
};

function DropIndicator({ DropIndicatorComponent, style }: DropIndicatorProps) {
  const { touchedItemHeight, touchedItemWidth } = useMeasurementsContext();
  const { activationProgress, activeItemDropped, touchedItemKey } =
    useDragContext();
  const { itemPositions, keyToIndex } = usePositionsContext();

  const { x, y } = useItemPosition(touchedItemKey, {
    easing: Easing.out(Easing.ease),
    ignoreActive: true
  });

  const dropIndex = useSharedValue(0);
  const dropPosition = useSharedValue<Vector>({ x: 0, y: 0 });

  useAnimatedReaction(
    () => ({
      kToI: keyToIndex.value,
      key: touchedItemKey.value,
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
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <DropIndicatorComponent
        activationProgress={activationProgress}
        dropIndex={dropIndex}
        dropPosition={dropPosition}
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
