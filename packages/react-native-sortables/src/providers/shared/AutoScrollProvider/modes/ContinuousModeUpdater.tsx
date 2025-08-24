import { useCallback } from 'react';
import {
  type FrameInfo,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useFrameCallback
} from 'react-native-reanimated';

import type { AutoScrollContinuousModeSettings } from '../../../../types';
import { useCommonValuesContext } from '../../CommonValuesProvider';

type ContinuousModeUpdaterProps = AutoScrollContinuousModeSettings & {
  progress: SharedValue<number>;
  handleScroll: (offset: number, animated?: boolean) => void;
};

export default function ContinuousModeUpdater({
  autoScrollMaxVelocity,
  handleScroll,
  progress
}: ContinuousModeUpdaterProps) {
  const { activeItemKey } = useCommonValuesContext();

  const [maxStartVelocity, maxEndVelocity]: [number, number] = Array.isArray(
    autoScrollMaxVelocity
  )
    ? autoScrollMaxVelocity
    : [autoScrollMaxVelocity, autoScrollMaxVelocity];

  const frameCallbackFunction = useCallback(
    ({ timeSincePreviousFrame }: FrameInfo) => {
      'worklet';
      if (!timeSincePreviousFrame) {
        return;
      }

      const velocity = interpolate(
        progress.value,
        [-1, 0, 1],
        [-maxStartVelocity, 0, maxEndVelocity]
      );

      const distance = (velocity * timeSincePreviousFrame) / 1000;

      handleScroll(distance);
    },
    [handleScroll, maxStartVelocity, maxEndVelocity, progress]
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
    enabled => runOnJS(toggleFrameCallback)(enabled),
    [toggleFrameCallback]
  );

  return null;
}
