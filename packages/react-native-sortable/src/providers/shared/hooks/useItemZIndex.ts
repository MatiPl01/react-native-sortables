import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemZIndex(
  key: string,
  pressProgress: SharedValue<number>,
  position: {
    x: SharedValue<null | number>;
    y: SharedValue<null | number>;
  }
): SharedValue<number> {
  const { itemPositions, touchedItemKey } = useCommonValuesContext();

  const zIndex = useSharedValue(0);

  useAnimatedReaction(
    () => ({
      isTouched: touchedItemKey.value === key,
      progress: pressProgress.value,
      targetPosition: itemPositions.value[key]
    }),
    ({ isTouched, progress, targetPosition }) => {
      if (isTouched) {
        zIndex.value = 3;
      } else if (progress > 0) {
        zIndex.value = 2;
      } else if (
        targetPosition &&
        (position.x.value !== targetPosition.x ||
          position.y.value !== targetPosition.y)
      ) {
        zIndex.value = 1;
      } else {
        zIndex.value = 0;
      }
    }
  );

  return zIndex;
}
