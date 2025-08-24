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
import { useCommonValuesContext } from '../../CommonValuesProvider';

type ContinuousModeUpdaterProps = AutoScrollContinuousModeSettings & {
  progress: SharedValue<number>;
  scrollBy: (distance: number, animated?: boolean) => void;
};

export default function ContinuousModeUpdater({
  autoScrollInterval,
  autoScrollMaxVelocity,
  progress,
  scrollBy
}: ContinuousModeUpdaterProps) {
  const { activeItemKey } = useCommonValuesContext();

  const [maxStartVelocity, maxEndVelocity]: [number, number] = Array.isArray(
    autoScrollMaxVelocity
  )
    ? autoScrollMaxVelocity
    : [autoScrollMaxVelocity, autoScrollMaxVelocity];

  const lastUpdateTimestamp = useMutableValue<null | number>(null);

  const frameCallbackFunction = useCallback(
    ({ timestamp }: FrameInfo) => {
      'worklet';
      lastUpdateTimestamp.value ??= timestamp;
      const elapsedTime = timestamp - lastUpdateTimestamp.value;
      if (elapsedTime < autoScrollInterval) {
        return;
      }
      lastUpdateTimestamp.value = timestamp;

      const velocity = interpolate(
        progress.value,
        [-1, 0, 1],
        [-maxStartVelocity, 0, maxEndVelocity]
      );

      const distance = velocity * (elapsedTime / 1000);

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
