import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useAnimatableValue } from '../../../hooks';
import type { Animatable } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemDimensions(key: Animatable<null | string>): {
  width: SharedValue<number>;
  height: SharedValue<number>;
} {
  const { itemDimensions, overrideItemDimensions } = useCommonValuesContext();

  const itemKey = useAnimatableValue(key);
  const width = useSharedValue(0);
  const height = useSharedValue(0);

  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      k: itemKey.value,
      overrideDimensions: overrideItemDimensions.value
    }),
    ({ dimensions, k, overrideDimensions }) => {
      if (k === null) {
        return;
      }

      const override = overrideDimensions[k];
      const dims = dimensions[k];

      width.value = override?.width ?? dims?.width ?? 0;
      height.value = override?.height ?? dims?.height ?? 0;
    }
  );

  return { height, width };
}
