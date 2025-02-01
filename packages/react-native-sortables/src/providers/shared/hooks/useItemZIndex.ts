import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemZIndex(
  key: string,
  pressProgress: SharedValue<number>
): SharedValue<number> {
  const { prevTouchedItemKey, touchedItemKey } = useCommonValuesContext();

  return useDerivedValue<number>(() => {
    if (touchedItemKey.value === key) {
      return 3;
    }
    if (prevTouchedItemKey.value === key) {
      return 2;
    }
    if (pressProgress.value > 0) {
      return 1;
    }
    return 0;
  });
}
