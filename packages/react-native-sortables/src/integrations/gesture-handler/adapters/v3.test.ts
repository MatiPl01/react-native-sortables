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

it('keeps worklet touchable handlers on the reanimated detector and JS ones off it', () => {
  const jsTap = jest.fn();
  const workletLongPress = Object.assign(jest.fn(), { __workletHash: 1 });

  renderHook(() =>
    useTouchableGesture({
      externalGesture: {},
      failDistance: 10,
      gestureMode: 'exclusive',
      onLongPress: workletLongPress,
      onTap: jsTap,
      onTouchesDown: jest.fn()
    })
  );

  const configOf = (mock: jest.Mock) =>
    mock.mock.calls.map(([config]) => config as Record<string, unknown>);

  // Plain JS handlers opt out of the reanimated detector (its `useHandler`
  // rejects non-worklets); worklet handlers keep it and run on the UI thread.
  const tapConfig = configOf(mocked.useTapGesture).find(
    config => config.onActivate === jsTap
  );
  expect(tapConfig?.disableReanimated).toBe(true);

  const [longPressConfig] = configOf(mocked.useLongPressGesture);
  expect(longPressConfig?.onActivate).toBe(workletLongPress);
  expect(longPressConfig?.disableReanimated).toBe(false);

  expect(configOf(mocked.useManualGesture)[0]?.disableReanimated).toBe(true);
});
