import { renderHook } from '@testing-library/react-hooks';
import * as GestureHandler from 'react-native-gesture-handler';
import { isWorkletFunction } from 'react-native-reanimated';

import { useDragGesture, useTouchableGesture } from '../index';
import type { ManualGestureCallbacks } from '../types';

// gesture-handler with the hook API present -> the integration must select the
// v3 hook adapter (the one that fixes issue #349).
// Tag each composed/leaf gesture so a test can tell which composition wrapped
// which - `useSimultaneousGestures` is reused for the 'simultaneous' recognizer
// group and for the outer wrap that keeps the touch tracker observing.
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: () => null,
  GestureStateManager: {
    activate: jest.fn(),
    deactivate: jest.fn(),
    fail: jest.fn()
  },
  useExclusiveGestures: jest.fn((...gestures) => ({
    gestures,
    kind: 'exclusive'
  })),
  useLongPressGesture: jest.fn(() => ({ handlerTag: 3, kind: 'longPress' })),
  useManualGesture: jest.fn(() => ({
    config: {},
    handlerTag: 1,
    kind: 'manual'
  })),
  useSimultaneousGestures: jest.fn((...gestures) => ({
    gestures,
    kind: 'simultaneous'
  })),
  useTapGesture: jest.fn(() => ({ handlerTag: 2, kind: 'tap' }))
}));

const mocked = GestureHandler as unknown as {
  useExclusiveGestures: jest.Mock;
  useLongPressGesture: jest.Mock;
  useManualGesture: jest.Mock;
  useSimultaneousGestures: jest.Mock;
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

it('composes the touch tracker simultaneously with the recognizers so onTouchesUp survives a winning long press', () => {
  // Regression: with the tracker composed exclusively, a winning long press
  // cancelled it and dropped onTouchesUp. It must instead be composed as
  // simultaneous(exclusive(...recognizers), manualTracker) so it is never a
  // losing sibling.
  renderHook(() =>
    useTouchableGesture({
      externalGesture: {},
      failDistance: 10,
      gestureMode: 'exclusive',
      onLongPress: jest.fn(),
      onTap: jest.fn(),
      onTouchesDown: jest.fn(),
      onTouchesUp: jest.fn()
    })
  );
  expect(mocked.useExclusiveGestures).toHaveBeenCalledTimes(1);
  expect(mocked.useSimultaneousGestures).toHaveBeenCalledTimes(1);
  const outer = mocked.useSimultaneousGestures.mock.calls[0] as Array<{
    kind: string;
  }>;
  expect(outer).toHaveLength(2);
  expect(outer[0]!.kind).toBe('exclusive');
  expect(outer[1]!.kind).toBe('manual');
});

it('returns the bare touch tracker when only touch callbacks are set (no recognizer wrap)', () => {
  renderHook(() =>
    useTouchableGesture({
      externalGesture: {},
      failDistance: 10,
      gestureMode: 'exclusive',
      onTouchesDown: jest.fn(),
      onTouchesUp: jest.fn()
    })
  );

  // No tap/long-press recognizers -> the tracker is used directly, so there is
  // no outer simultaneous wrap around it.
  expect(mocked.useTapGesture).not.toHaveBeenCalled();
  expect(mocked.useLongPressGesture).not.toHaveBeenCalled();
  expect(useManualGesture).toHaveBeenCalledTimes(1);
  expect(mocked.useSimultaneousGestures).not.toHaveBeenCalled();
});
