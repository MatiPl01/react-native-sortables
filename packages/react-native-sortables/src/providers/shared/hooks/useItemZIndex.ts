import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemZIndex(
  key: string,
  pressProgress: SharedValue<number>
): SharedValue<number> {
  const { activeItemKey, prevActiveItemKey } = useCommonValuesContext();

  return useDerivedValue<number>(() => {
    if (activeItemKey.value === key) {
      return 3;
    }
    if (prevActiveItemKey.value === key) {
      return 2;
    }
    if (pressProgress.value > 0) {
      return 1;
    }
    return 0;
  });
}
