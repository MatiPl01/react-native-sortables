'worklet';
import { makeMutable } from 'react-native-reanimated';

import type { AnyFunction } from '../../../helperTypes';

const PENDING_TIMEOUTS = makeMutable<Record<string, boolean>>({});
const TIMEOUT_ID = makeMutable(0);

export type AnimatedTimeoutID = number;

function removeFromPendingTimeouts(id: AnimatedTimeoutID): void {
  PENDING_TIMEOUTS.modify(pendingTimeouts => {
    'worklet';
    delete pendingTimeouts[id];
    return pendingTimeouts;
  });
}

export function setAnimatedTimeout<F extends AnyFunction>(
  callback: F,
  delay = 0
): AnimatedTimeoutID {
  let startTimestamp: number;

  const currentId = TIMEOUT_ID.value;
  PENDING_TIMEOUTS.value[currentId] = true;
  TIMEOUT_ID.value += 1;

  const step = (newTimestamp: number) => {
    if (!PENDING_TIMEOUTS.value[currentId]) {
      return;
    }
    startTimestamp ??= newTimestamp;
    if (newTimestamp > startTimestamp + delay) {
      removeFromPendingTimeouts(currentId);
      callback();
      return;
    }
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  return currentId;
}

export function clearAnimatedTimeout(handle: AnimatedTimeoutID): void {
  removeFromPendingTimeouts(handle);
}
