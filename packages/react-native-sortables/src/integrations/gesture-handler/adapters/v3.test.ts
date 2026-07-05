import { renderHook } from '@testing-library/react-hooks';
import * as GestureHandler from 'react-native-gesture-handler';

import { useDragGesture, useTouchableGesture } from '../index';
import type { ManualGestureCallbacks } from '../types';

// gesture-handler with the hook API present -> the integration must select the
// v3 hook adapter (the one that fixes issue #349).
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: () => null,
  GestureStateManager: {
    activate: jest.fn(),
    deactivate: jest.fn(),
    fail: jest.fn()
  },
  useExclusiveGestures: jest.fn(() => ({})),
  useLongPressGesture: jest.fn(() => ({ handlerTag: 3 })),
  useManualGesture: jest.fn(() => ({ config: {}, handlerTag: 1 })),
  useSimultaneousGestures: jest.fn(() => ({})),
  useTapGesture: jest.fn(() => ({ handlerTag: 2 }))
}));

const mocked = GestureHandler as unknown as {
  useLongPressGesture: jest.Mock;
  useManualGesture: jest.Mock;
  useTapGesture: jest.Mock;
};
const useManualGesture = mocked.useManualGesture;

const callbacks: ManualGestureCallbacks = {
  onTouchesCancelled: jest.fn(),
  onTouchesDown: jest.fn(),
  onTouchesMove: jest.fn(),
  onTouchesUp: jest.fn()
};

it('selects the v3 adapter and wires the drag callbacks into the manual hook', () => {
  renderHook(() => useDragGesture(callbacks, []));

  expect(useManualGesture).toHaveBeenCalledTimes(1);
  const [config] = useManualGesture.mock.calls[0] as [Record<string, unknown>];
  expect(typeof config.onTouchesDown).toBe('function');
  expect(typeof config.onTouchesUp).toBe('function');
});

it('disables the reanimated detector for touchable JS callbacks', () => {
  const onTap = jest.fn();

  renderHook(() =>
    useTouchableGesture({
      externalGesture: {},
      failDistance: 10,
      gestureMode: 'exclusive',
      onLongPress: jest.fn(),
      onTap,
      onTouchesDown: jest.fn()
    })
  );

  // Touchable handlers are plain JS callbacks, not worklets. Every gesture must
  // set `disableReanimated` so reanimated's `useHandler` (which rejects
  // non-worklet handlers) never runs - `runOnJS` alone does not skip that check.
  const configOf = (mock: jest.Mock) =>
    mock.mock.calls.map(([config]) => config as Record<string, unknown>);

  for (const config of configOf(mocked.useTapGesture)) {
    expect(config.disableReanimated).toBe(true);
  }
  for (const config of configOf(mocked.useLongPressGesture)) {
    expect(config.disableReanimated).toBe(true);
  }
  for (const config of configOf(mocked.useManualGesture)) {
    expect(config.disableReanimated).toBe(true);
  }

  // The JS callback is forwarded untouched as the tap handler.
  expect(
    configOf(mocked.useTapGesture).some(config => config.onActivate === onTap)
  ).toBe(true);
});
