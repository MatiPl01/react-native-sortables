import { renderHook } from '@testing-library/react-hooks';
import { Gesture } from 'react-native-gesture-handler';

import type { ManualGestureCallbacks, TouchableGestureConfig } from '../types';
import { adapter } from './v2';

type BuilderMock = Record<
  | 'enabled'
  | 'maxDistance'
  | 'numberOfTaps'
  | 'onStart'
  | 'onTouchesCancelled'
  | 'onTouchesDown'
  | 'onTouchesMove'
  | 'onTouchesUp'
  | 'runOnJS'
  | 'simultaneousWithExternalGesture',
  jest.Mock
>;

type GestureMockShape = Record<
  'Exclusive' | 'LongPress' | 'Manual' | 'Simultaneous' | 'Tap',
  jest.Mock
>;

// Mock gesture-handler with the v2 imperative builder surface: every builder
// method returns the builder so the adapter's chained calls can be inspected.
jest.mock('react-native-gesture-handler', () => {
  const makeBuilder = (): BuilderMock => {
    const builder = {} as BuilderMock;
    const chain = (): BuilderMock => builder;
    builder.enabled = jest.fn(chain);
    builder.maxDistance = jest.fn(chain);
    builder.numberOfTaps = jest.fn(chain);
    builder.onStart = jest.fn(chain);
    builder.onTouchesCancelled = jest.fn(chain);
    builder.onTouchesDown = jest.fn(chain);
    builder.onTouchesMove = jest.fn(chain);
    builder.onTouchesUp = jest.fn(chain);
    builder.runOnJS = jest.fn(chain);
    builder.simultaneousWithExternalGesture = jest.fn(chain);
    return builder;
  };
  return {
    Gesture: {
      Exclusive: jest.fn((...gestures: Array<unknown>) => ({
        gestures,
        kind: 'exclusive'
      })),
      LongPress: jest.fn(makeBuilder),
      Manual: jest.fn(makeBuilder),
      Simultaneous: jest.fn((...gestures: Array<unknown>) => ({
        gestures,
        kind: 'simultaneous'
      })),
      Tap: jest.fn(makeBuilder)
    },
    GestureDetector: () => null
  };
});

const GestureMock = Gesture as unknown as GestureMockShape;

const lastBuilder = (mock: jest.Mock): BuilderMock => {
  const { results } = mock.mock;
  return results[results.length - 1]!.value as BuilderMock;
};

const DRAG_CALLBACKS: ManualGestureCallbacks = {
  onTouchesCancelled: jest.fn(),
  onTouchesDown: jest.fn(),
  onTouchesMove: jest.fn(),
  onTouchesUp: jest.fn()
};

const touchableConfig = (
  overrides: Partial<TouchableGestureConfig>
): TouchableGestureConfig => ({
  externalGesture: {} as TouchableGestureConfig['externalGesture'],
  failDistance: 10,
  gestureMode: 'exclusive',
  ...overrides
});

describe('gesture-handler v2 adapter', () => {
  it('builds the drag gesture from the manual builder with the callbacks', () => {
    renderHook(() => adapter.useDragGesture(DRAG_CALLBACKS, []));

    expect(GestureMock.Manual).toHaveBeenCalledTimes(1);
    const manual = lastBuilder(GestureMock.Manual);
    expect(manual.onTouchesDown).toHaveBeenCalledWith(
      DRAG_CALLBACKS.onTouchesDown
    );
    expect(manual.onTouchesMove).toHaveBeenCalledWith(
      DRAG_CALLBACKS.onTouchesMove
    );
    expect(manual.onTouchesCancelled).toHaveBeenCalledWith(
      DRAG_CALLBACKS.onTouchesCancelled
    );
    expect(manual.onTouchesUp).toHaveBeenCalledWith(DRAG_CALLBACKS.onTouchesUp);
  });

  it('toggles enabled through the builder', () => {
    const enabled = jest.fn();
    const built = { enabled } as unknown as Parameters<
      typeof adapter.useEnabledGesture
    >[0];

    renderHook(() => adapter.useEnabledGesture(built, false));

    expect(enabled).toHaveBeenCalledWith(false);
  });

  it('applies maxDistance to Tap/LongPress but never to the Manual fallback', () => {
    renderHook(() =>
      adapter.useTouchableGesture(
        touchableConfig({
          onLongPress: jest.fn(),
          onTap: jest.fn(),
          onTouchesDown: jest.fn()
        })
      )
    );

    expect(lastBuilder(GestureMock.Tap).maxDistance).toHaveBeenCalledWith(10);
    expect(lastBuilder(GestureMock.LongPress).maxDistance).toHaveBeenCalledWith(
      10
    );
    // Manual is only created as the touches fallback and has no maxDistance.
    expect(GestureMock.Manual).not.toHaveBeenCalled();
    expect(GestureMock.Exclusive).toHaveBeenCalledTimes(1);
  });

  it('composes with Simultaneous when gestureMode is simultaneous', () => {
    renderHook(() =>
      adapter.useTouchableGesture(
        touchableConfig({ gestureMode: 'simultaneous', onTap: jest.fn() })
      )
    );

    expect(GestureMock.Simultaneous).toHaveBeenCalledTimes(1);
    expect(GestureMock.Exclusive).not.toHaveBeenCalled();
  });

  it('wires touches-only handlers onto a manual gesture', () => {
    renderHook(() =>
      adapter.useTouchableGesture(
        touchableConfig({ onTouchesDown: jest.fn(), onTouchesUp: jest.fn() })
      )
    );

    expect(GestureMock.Manual).toHaveBeenCalledTimes(1);
    const manual = lastBuilder(GestureMock.Manual);
    expect(manual.onTouchesDown).toHaveBeenCalled();
    expect(manual.onTouchesUp).toHaveBeenCalled();
  });
});
