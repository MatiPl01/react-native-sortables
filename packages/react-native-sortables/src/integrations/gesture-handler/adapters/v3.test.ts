import { renderHook } from '@testing-library/react-hooks';
import * as GestureHandler from 'react-native-gesture-handler';

import type { ManualGestureCallbacks, TouchableGestureConfig } from '../types';
import { adapter } from './v3';

type V3Mock = Record<
  | 'useExclusiveGestures'
  | 'useLongPressGesture'
  | 'useManualGesture'
  | 'useSimultaneousGestures'
  | 'useTapGesture',
  jest.Mock
>;

// Mock gesture-handler with the v3 hook API surface. Hooks return plain-object
// gestures (as the real v3 hooks do) so composition/config handling can run.
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: () => null,
  GestureStateManager: {
    activate: jest.fn(),
    deactivate: jest.fn(),
    fail: jest.fn()
  },
  useExclusiveGestures: jest.fn((...gestures: Array<unknown>) => ({
    gestures,
    kind: 'exclusive'
  })),
  useLongPressGesture: jest.fn(() => ({ config: {}, handlerTag: 3 })),
  useManualGesture: jest.fn(() => ({ config: {}, handlerTag: 1 })),
  useSimultaneousGestures: jest.fn((...gestures: Array<unknown>) => ({
    gestures,
    kind: 'simultaneous'
  })),
  useTapGesture: jest.fn(() => ({ config: {}, handlerTag: 2 }))
}));

const gh = GestureHandler as unknown as V3Mock;

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

describe('gesture-handler v3 adapter', () => {
  it('builds the drag gesture from the manual hook with worklet callbacks', () => {
    renderHook(() => adapter.useDragGesture(DRAG_CALLBACKS, []));

    expect(gh.useManualGesture).toHaveBeenCalledTimes(1);
    const [config] = gh.useManualGesture.mock.calls[0] as [
      Record<string, unknown>
    ];
    expect(typeof config.onTouchesDown).toBe('function');
    expect(typeof config.onTouchesMove).toBe('function');
    expect(typeof config.onTouchesUp).toBe('function');
    expect(typeof config.onTouchesCancel).toBe('function');
  });

  it('creates every touchable gesture and composes them exclusively', () => {
    renderHook(() =>
      adapter.useTouchableGesture(
        touchableConfig({
          onDoubleTap: jest.fn(),
          onLongPress: jest.fn(),
          onTap: jest.fn(),
          onTouchesDown: jest.fn()
        })
      )
    );

    // Hooks run unconditionally (stable order), so all are always created.
    expect(gh.useTapGesture).toHaveBeenCalledTimes(2); // tap + double tap
    expect(gh.useLongPressGesture).toHaveBeenCalledTimes(1);
    expect(gh.useManualGesture).toHaveBeenCalledTimes(1);
    expect(gh.useExclusiveGestures).toHaveBeenCalledTimes(1);
  });

  it('composes simultaneously when gestureMode is simultaneous', () => {
    renderHook(() =>
      adapter.useTouchableGesture(
        touchableConfig({ gestureMode: 'simultaneous', onTap: jest.fn() })
      )
    );

    expect(gh.useSimultaneousGestures).toHaveBeenCalledTimes(1);
  });

  it('returns a copy of the gesture with enabled toggled inside config', () => {
    const original = { config: { enabled: true }, handlerTag: 9 };

    const { result } = renderHook(() =>
      adapter.useEnabledGesture(
        original as unknown as Parameters<typeof adapter.useEnabledGesture>[0],
        false
      )
    );

    const next = result.current as unknown as { config: { enabled: boolean } };
    expect(next.config.enabled).toBe(false);
    // The original gesture object must not be mutated.
    expect(original.config.enabled).toBe(true);
  });
});
