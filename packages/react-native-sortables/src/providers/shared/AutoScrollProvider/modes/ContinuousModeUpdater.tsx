import { useCallback } from 'react';
import {
  type FrameInfo,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useFrameCallback
} from 'react-native-reanimated';

import { useMutableValue } from '../../../../integrations/reanimated';
import type { AutoScrollContinuousModeSettings } from '../../../../types';
import { toPair } from '../../../../utils';
import { useCommonValuesContext } from '../../CommonValuesProvider';

type ContinuousModeUpdaterProps = AutoScrollContinuousModeSettings & {
  progress: SharedValue<number>;
  scrollBy: (distance: number, animated?: boolean) => void;
};

// Maximum elapsed time multiplier to prevent excessive scrolling distances when app lags
const MAX_ELAPSED_TIME_MULTIPLIER = 2;

export default function ContinuousModeUpdater({
  autoScrollInterval,
  autoScrollMaxVelocity,
  progress,
  scrollBy
}: ContinuousModeUpdaterProps) {
  const { activeItemKey } = useCommonValuesContext();

  const lastUpdateTimestamp = useMutableValue<null | number>(null);
  const [maxStartVelocity, maxEndVelocity] = toPair(autoScrollMaxVelocity);

  const frameCallbackFunction = useCallback(
    ({ timestamp }: FrameInfo) => {
      'worklet';
      if (progress.value === 0) {
        return;
      }

      lastUpdateTimestamp.value ??= timestamp;
      const elapsedTime = timestamp - lastUpdateTimestamp.value;
      if (elapsedTime < autoScrollInterval) {
        return;
      }

      // Cap the elapsed time to prevent excessive scrolling distances when app lags
      const maxElapsedTime = autoScrollInterval * MAX_ELAPSED_TIME_MULTIPLIER;
      const cappedElapsedTime = Math.min(elapsedTime, maxElapsedTime);
      lastUpdateTimestamp.value = timestamp;

      const velocity = interpolate(
        progress.value,
        [-1, 0, 1],
        [-maxStartVelocity, 0, maxEndVelocity]
      );

      const distance = velocity * (cappedElapsedTime / 1000);

      scrollBy(distance, autoScrollInterval > 200);
    },
    [
      scrollBy,
      maxStartVelocity,
      maxEndVelocity,
      progress,
      autoScrollInterval,
      lastUpdateTimestamp
    ]
  );

  const frameCallback = useFrameCallback(frameCallbackFunction, false);

  const toggleFrameCallback = useCallback(
    (enabled: boolean) => {
      frameCallback.setActive(enabled);
    },
    [frameCallback]
  );

  useAnimatedReaction(
    () => !!activeItemKey.value,
    enabled => {
      lastUpdateTimestamp.value = null;
      runOnJS(toggleFrameCallback)(enabled);
    },
    [toggleFrameCallback]
  );

  return null;
}
