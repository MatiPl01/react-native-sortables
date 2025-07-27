import type { SharedValue } from 'react-native-reanimated';
import { isSharedValue, useDerivedValue } from 'react-native-reanimated';

import type { Animatable } from '../../../integrations/reanimated';
import type { Dimensions } from '../../../types';
import { getItemDimensions } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemDimensions(
  key: Animatable<null | string>
): SharedValue<Dimensions | null> {
  const { itemHeights, itemWidths } = useCommonValuesContext();

  return useDerivedValue(() => {
    const keyValue = isSharedValue<null | string>(key) ? key.value : key;

    return keyValue
      ? getItemDimensions(keyValue, itemWidths.value, itemHeights.value)
      : null;
  });
}
