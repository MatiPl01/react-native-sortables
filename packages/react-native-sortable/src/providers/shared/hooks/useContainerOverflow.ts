import { useDerivedValue } from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useContainerOverflow() {
  const { activeItemDropped, touchedItemKey } = useCommonValuesContext();

  return useDerivedValue(() =>
    touchedItemKey.value !== null || !activeItemDropped.value
      ? 'visible'
      : 'hidden'
  );
}
