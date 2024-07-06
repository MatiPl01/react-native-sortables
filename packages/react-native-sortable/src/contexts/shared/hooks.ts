import {
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import type { Dimensions, Position } from '@/types';

import { useDragContext } from './DragProvider';
import { useMeasurementsContext } from './MeasurementsProvider';
import { usePositionsContext } from './PositionsProvider';

export function useItemPosition(key: string) {
  const { itemPositions } = usePositionsContext();
  const { activeItemKey, activeItemPosition } = useDragContext();

  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);

  useAnimatedReaction(
    () => ({
      isActive: activeItemKey.value === key,
      position: itemPositions.value[key]
    }),
    ({ isActive, position }) => {
      if (!position || isActive) {
        return;
      }
      x.value = x.value === null ? position.x : withTiming(position.x);
      y.value = y.value === null ? position.y : withTiming(position.y);
    },
    [key]
  );

  useAnimatedReaction(
    () => ({
      position: activeItemPosition.value
    }),
    ({ position }) => {
      if (activeItemKey.value === key) {
        x.value = position.x;
        y.value = position.y;
      }
    }
  );

  return { x, y };
}

export function useActiveItemReaction(
  callback: (props: {
    activeKey: string;
    activeIndex: number;
    dimensions: Dimensions;
    position: Position;
    centerPosition: Position;
  }) => void,
  deps?: Array<unknown>
) {
  const { keyToIndex } = usePositionsContext();
  const { itemDimensions } = useMeasurementsContext();
  const { activeItemKey, activeItemPosition } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      activePosition: activeItemPosition.value
    }),
    ({ activeKey, activePosition }) => {
      if (activeKey === null) {
        return;
      }
      const dimensions = itemDimensions.value[activeKey];
      if (!dimensions) {
        return;
      }

      const centerY = activePosition.y + dimensions.height / 2;
      const centerX = activePosition.x + dimensions.width / 2;
      const activeIndex = keyToIndex.value[activeKey];

      if (activeIndex === undefined) {
        return;
      }

      const centerPosition = {
        x: centerX,
        y: centerY
      };

      callback({
        activeIndex,
        activeKey,
        centerPosition,
        dimensions,
        position: activePosition
      });
    },
    deps
  );
}
