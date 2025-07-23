import { useDerivedValue } from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemDimensions(key: string) {
  const { itemDimensions } = useCommonValuesContext();

  return useDerivedValue(() => itemDimensions.value[key]);
}
