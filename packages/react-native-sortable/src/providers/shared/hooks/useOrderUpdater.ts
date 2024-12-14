import { useAnimatedReaction } from 'react-native-reanimated';

import type { Dimensions, Maybe, Vector } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export type OrderUpdaterCallbackProps = {
  activeKey: string;
  activeIndex: number;
  dimensions: Dimensions;
  position: Vector;
  touchPosition: Vector;
};

export type OrderUpdater = (
  params: OrderUpdaterCallbackProps
) => Maybe<Array<string>>;

export default function useOrderUpdater(
  updater: OrderUpdater,
  deps?: Array<unknown>
) {
  const {
    activeItemKey,
    itemDimensions,
    keyToIndex,
    touchPosition,
    touchedItemPosition
  } = useCommonValuesContext();
  const { handleOrderChange } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      positions: {
        item: touchedItemPosition.value,
        touch: touchPosition.value
      }
    }),
    ({ activeKey, positions }) => {
      if (
        activeKey === null ||
        positions.item === null ||
        positions.touch === null
      ) {
        return;
      }
      const dimensions = itemDimensions.value[activeKey];
      if (!dimensions) {
        return;
      }

      const activeIndex = keyToIndex.value[activeKey];
      if (activeIndex === undefined) {
        return;
      }

      const newOrder = updater({
        activeIndex,
        activeKey,
        dimensions,
        position: positions.item,
        touchPosition: positions.touch
      });

      if (newOrder) {
        handleOrderChange(
          activeKey,
          activeIndex,
          newOrder.indexOf(activeKey),
          newOrder
        );
      }
    },
    deps
  );
}
