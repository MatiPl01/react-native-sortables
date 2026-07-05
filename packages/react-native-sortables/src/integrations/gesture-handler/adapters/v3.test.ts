import { renderHook } from '@testing-library/react-hooks';
import * as GestureHandler from 'react-native-gesture-handler';
import { isWorkletFunction } from 'react-native-reanimated';

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

it('creates a gesture only for the handlers that are provided and wraps them as worklets', () => {
  const onTap = jest.fn();

  renderHook(() =>
    useTouchableGesture({
      externalGesture: {},
      failDistance: 10,
      gestureMode: 'exclusive',
      onTap
    })
  );

  // Only onTap -> a single tap gesture; no long-press or manual gesture (so no
  // native handlers for callbacks the user never set).
  expect(mocked.useTapGesture).toHaveBeenCalledTimes(1);
  expect(mocked.useLongPressGesture).not.toHaveBeenCalled();
  expect(mocked.useManualGesture).not.toHaveBeenCalled();

  // The raw JS handler is wrapped into a worklet, so the reanimated detector's
  // `useHandler` never sees a non-worklet (which would throw at render).
  const [tapConfig] = mocked.useTapGesture.mock.calls[0] as [
    Record<string, unknown>
  ];
  expect(tapConfig.onActivate).not.toBe(onTap);
  expect(isWorkletFunction(tapConfig.onActivate)).toBe(true);
});

it('creates tap, double-tap, long-press and manual gestures when every handler is set', () => {
  renderHook(() =>
    useTouchableGesture({
      externalGesture: {},
      failDistance: 10,
      gestureMode: 'exclusive',
      onDoubleTap: jest.fn(),
      onLongPress: jest.fn(),
      onTap: jest.fn(),
      onTouchesDown: jest.fn(),
      onTouchesUp: jest.fn()
    })
  );

  expect(mocked.useTapGesture).toHaveBeenCalledTimes(2);
  expect(mocked.useLongPressGesture).toHaveBeenCalledTimes(1);
  expect(mocked.useManualGesture).toHaveBeenCalledTimes(1);
});
