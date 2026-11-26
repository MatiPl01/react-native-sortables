import { useMemo } from 'react';

import { IS_WEB } from '../../../constants';
import { useStableCallbackValue } from '../../reanimated';
import { Haptics } from '../adapters';

type HapticImpact = {
  light(): void;
  medium(): void;
};

let hapticFeedback: null | ReturnType<typeof Haptics.load> = null;

export default function useHaptics(enabled: boolean): HapticImpact {
  const loadedTrigger =
    !IS_WEB && enabled ? (hapticFeedback ??= Haptics.load()) : null;
  // Worklets capture the trigger when they are created, so it is read from a
  // shared value instead. This picks up a trigger loaded when haptics are
  // enabled after the first render and keeps the returned worklets the same.
  const trigger = useStableCallbackValue(loadedTrigger ?? undefined);

  return useMemo(
    () => ({
      light: () => {
        'worklet';
        trigger('impactLight');
      },
      medium: () => {
        'worklet';
        trigger('impactMedium');
      }
    }),
    [trigger]
  );
}
