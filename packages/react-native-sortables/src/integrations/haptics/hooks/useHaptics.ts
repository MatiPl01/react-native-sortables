import { useCallback, useMemo } from 'react';

import { IS_WEB } from '../../../constants';
import { Haptics } from '../adapters';

type HapticImpact = {
  light(): void;
  medium(): void;
};

let hapticFeedback: null | ReturnType<typeof Haptics.load> = null;

export default function useHaptics(enabled: boolean): HapticImpact {
  // Worklets capture the trigger when they are created, so it is a dependency
  // that creates them again when haptics are enabled after the first render
  const trigger =
    !IS_WEB && enabled ? (hapticFeedback ??= Haptics.load()) : null;

  const light = useCallback(() => {
    'worklet';
    trigger?.('impactLight');
  }, [trigger]);

  const medium = useCallback(() => {
    'worklet';
    trigger?.('impactMedium');
  }, [trigger]);

  return useMemo(
    () => ({
      light,
      medium
    }),
    [light, medium]
  );
}
