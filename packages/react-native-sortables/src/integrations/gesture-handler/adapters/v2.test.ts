import { renderHook } from '@testing-library/react-hooks';
import { Gesture } from 'react-native-gesture-handler';

import { useDragGesture, useTouchableGesture } from '../index';
import type { ManualGestureCallbacks } from '../types';

// gesture-handler without the hook API -> the integration must select the v2
// imperative-builder adapter. Each builder is a chainable stub that records the
// touch handlers attached to it (and its kind), so a test can assert the shape
// of the composed touchable gesture tree.
jest.mock('react-native-gesture-handler', () => {
  const makeGesture = (kind: string) => {
    const gesture: Record<string, unknown> = { handlers: {}, kind };
    for (const method of [
      'maxDistance',
      'numberOfTaps',
      'onStart',
      'runOnJS',
      'shouldCancelWhenOutside',
      'simultaneousWithExternalGesture'
    ]) {
      gesture[method] = jest.fn(() => gesture);
    }
    for (const method of [
      'onTouchesCancelled',
      'onTouchesDown',
      'onTouchesMove',
      'onTouchesUp'
    ]) {
      gesture[method] = jest.fn((callback: unknown) => {
        (gesture.handlers as Record<string, unknown>)[method] = callback;
        return gesture;
      });
    }
    return gesture;
  };

  return {
    Gesture: {
      Exclusive: jest.fn((...gestures: Array<unknown>) => ({
        gestures,
        kind: 'exclusive'
      })),
      LongPress: jest.fn(() => makeGesture('longPress')),
      Manual: jest.fn(() => makeGesture('manual')),
      Simultaneous: jest.fn((...gestures: Array<unknown>) => ({
        gestures,
        kind: 'simultaneous'
      })),
      Tap: jest.fn(() => makeGesture('tap'))
    },
    GestureDetector: () => null
  };
});

type MockGesture = { kind: string; handlers: Record<string, unknown> };
type MockComposed = {
  kind: string;
  gestures: Array<MockComposed | MockGesture>;
};

const mocked = Gesture as unknown as {
  Exclusive: jest.Mock;
  LongPress: jest.Mock;
  Manual: jest.Mock;
  Simultaneous: jest.Mock;
  Tap: jest.Mock;
};

const dragCallbacks: ManualGestureCallbacks = {
  onTouchesCancelled: jest.fn(),
  onTouchesDown: jest.fn(),
  onTouchesMove: jest.fn(),
  onTouchesUp: jest.fn()
};

const baseConfig = {
  externalGesture: {},
  failDistance: 10,
  gestureMode: 'exclusive' as const
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('selects the v2 adapter and wires the drag callbacks into the builder', () => {
  renderHook(() => useDragGesture(dragCallbacks, []));

  expect(mocked.Manual).toHaveBeenCalledTimes(1);
  const manual = mocked.Manual.mock.results[0]!.value as MockGesture;
  expect(manual.handlers.onTouchesDown).toBe(dragCallbacks.onTouchesDown);
  expect(manual.handlers.onTouchesUp).toBe(dragCallbacks.onTouchesUp);
});

it('keeps onTouchesUp on a separate manual tracker composed simultaneously, not on an exclusive recognizer', () => {
  // Regression (web): with onTouchesUp bolted onto the last recognizer inside
  // Gesture.Exclusive, a winning tap cancelled the losing long-press sibling and
  // dropped onTouchesUp. It must live on its own Manual composed simultaneously.
  const onTouchesUp = jest.fn();

  renderHook(() =>
    useTouchableGesture({
      ...baseConfig,
      onLongPress: jest.fn(),
      onTap: jest.fn(),
      onTouchesDown: jest.fn(),
      onTouchesUp
    })
  );

  // The two recognizers are grouped exclusively; the touch tracker is NOT one
  // of them, so a winning recognizer can no longer cancel it.
  expect(mocked.Exclusive).toHaveBeenCalledTimes(1);
  const recognizers = mocked.Exclusive.mock.calls[0] as Array<MockGesture>;
  expect(recognizers.map(recognizer => recognizer.kind)).toEqual([
    'tap',
    'longPress'
  ]);
  for (const recognizer of recognizers) {
    expect(recognizer.handlers.onTouchesUp).toBeUndefined();
  }

  // The outer wrap composes the exclusive group with the manual tracker, which
  // is the gesture that actually carries onTouchesUp.
  expect(mocked.Simultaneous).toHaveBeenCalledTimes(1);
  const outer = mocked.Simultaneous.mock.calls[0] as [
    MockComposed,
    MockGesture
  ];
  expect(outer[0].kind).toBe('exclusive');
  expect(outer[1].kind).toBe('manual');
  expect(outer[1].handlers.onTouchesUp).toBe(onTouchesUp);
});

it('disables shouldCancelWhenOutside on the recognizers so they survive a teleported item hide', () => {
  // Regression: the teleported item's still-mounted source cell is hidden
  // (off-screen / opacity 0), which reads as "outside" and, with the default
  // true, cancels Tap/LongPress - dropping onTap/onLongPress under the portal.
  renderHook(() =>
    useTouchableGesture({
      ...baseConfig,
      onLongPress: jest.fn(),
      onTap: jest.fn()
    })
  );

  const tap = mocked.Tap.mock.results[0]!.value as {
    shouldCancelWhenOutside: jest.Mock;
  };
  const longPress = mocked.LongPress.mock.results[0]!.value as {
    shouldCancelWhenOutside: jest.Mock;
  };
  expect(tap.shouldCancelWhenOutside).toHaveBeenCalledWith(false);
  expect(longPress.shouldCancelWhenOutside).toHaveBeenCalledWith(false);
});

it('returns the bare manual tracker when only touch callbacks are set', () => {
  const onTouchesUp = jest.fn();

  const { result } = renderHook(() =>
    useTouchableGesture({
      ...baseConfig,
      onTouchesDown: jest.fn(),
      onTouchesUp
    })
  );

  // No recognizers -> no Exclusive/Simultaneous wrap; the lone Manual (which
  // fires a clean onTouchesUp on web) is returned as is.
  expect(mocked.Tap).not.toHaveBeenCalled();
  expect(mocked.LongPress).not.toHaveBeenCalled();
  expect(mocked.Exclusive).not.toHaveBeenCalled();
  expect(mocked.Simultaneous).not.toHaveBeenCalled();
  expect(mocked.Manual).toHaveBeenCalledTimes(1);

  const gesture = result.current as MockGesture;
  expect(gesture.kind).toBe('manual');
  expect(gesture.handlers.onTouchesUp).toBe(onTouchesUp);
});

it('groups recognizers simultaneously when gestureMode is simultaneous', () => {
  renderHook(() =>
    useTouchableGesture({
      externalGesture: {},
      failDistance: 10,
      gestureMode: 'simultaneous',
      onDoubleTap: jest.fn(),
      onTap: jest.fn(),
      onTouchesUp: jest.fn()
    })
  );

  // The recognizer group uses Simultaneous (not Exclusive), and the outer wrap
  // that keeps the touch tracker observing also uses Simultaneous.
  expect(mocked.Exclusive).not.toHaveBeenCalled();
  expect(mocked.Simultaneous).toHaveBeenCalledTimes(2);
});
