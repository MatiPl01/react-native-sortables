import { useCallback } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

export default function useDerivedLayoutFactory<T>(
  useLayoutReaction: (
    idxToKey: SharedValue<Array<string>>,
    onChange: (layout: T | null) => void
  ) => void
) {
  return useCallback(
    (idxToKey: SharedValue<Array<string>>) => {
      const result = useSharedValue<T | null>(null);
      useLayoutReaction(idxToKey, layout => {
        'worklet';
        result.value = layout;
      });
      return result;
    },
    [useLayoutReaction]
  );
}
