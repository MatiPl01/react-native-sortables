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

    const isActive = activeItemKey.value === key;
    const isDropped = prevActiveItemKey.value === key;

    // A bare long press must not change the stacking order of the item, as
    // this dismisses a native context menu rendered in it
    if ((isActive || isDropped) && !activeItemBroughtToFront.value) {
      return orderZIndex;
    }

    if (isActive) {
      return 2 * itemCount + 1;
    }

    if (activationAnimationProgress.value > 0) {
      return isDropped ? 2 * itemCount : itemCount + orderZIndex;
    }

    return orderZIndex;
  });
}
