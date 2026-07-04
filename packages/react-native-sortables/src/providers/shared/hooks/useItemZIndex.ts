import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemZIndex(
  key: string,
  activationAnimationProgress: SharedValue<number>
): SharedValue<number> {
  const {
    activeItemBroughtToFront,
    activeItemKey,
    indexToKey,
    isStackingOrderDesc,
    keyToIndex,
    prevActiveItemKey
  } = useCommonValuesContext();

  return useDerivedValue<number>(() => {
    const itemCount = indexToKey.value.length;
    const realIndex = keyToIndex.value[key] ?? 0;
    const orderZIndex = isStackingOrderDesc
      ? itemCount - realIndex - 1
      : realIndex;

    // Keep the order zIndex until the item is actually dragged. See
    // https://github.com/MatiPl01/react-native-sortables/issues/417
    if (!activeItemBroughtToFront.value) {
      return orderZIndex;
    }

    if (activeItemKey.value === key) {
      return 2 * itemCount + 1;
    }

    if (activationAnimationProgress.value > 0) {
      if (prevActiveItemKey.value === key) {
        return 2 * itemCount;
      }

      return itemCount + orderZIndex;
    }

    return orderZIndex;
  });
}
