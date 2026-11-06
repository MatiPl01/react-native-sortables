import { renderHook } from '@testing-library/react-hooks';
import { makeMutable } from 'react-native-reanimated';

import type {
  GestureTouchEvent,
  ManualGestureControl
} from '../../../integrations/gesture-handler';
import { useDragGesture } from '../../../integrations/gesture-handler';
import type { ManualGestureCallbacks } from '../../../integrations/gesture-handler/types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';
import useItemPanGesture from './useItemPanGesture';

jest.mock('../../../integrations/gesture-handler', () => ({
  useDragGesture: jest.fn(() => ({ kind: 'manual' }))
}));
jest.mock('../CommonValuesProvider', () => ({
  useCommonValuesContext: jest.fn()
}));
jest.mock('../DragProvider', () => ({ useDragContext: jest.fn() }));

const mockedUseDragGesture = useDragGesture as unknown as jest.Mock;
const mockedUseCommonValuesContext =
  useCommonValuesContext as unknown as jest.Mock;
const mockedUseDragContext = useDragContext as unknown as jest.Mock;

const KEY = 'item-1';
const EVENT = { allTouches: [] } as unknown as GestureTouchEvent;

// Stands in for the DragProvider: `handleTouchStart` optionally picks the item
// up the way the activation timeout does, and `handleDragEnd` clears the active
// key the way the real one does.
const setup = (pickUpKey?: string) => {
  const activeItemKey = makeMutable<null | string>(null);
  const control: ManualGestureControl = {
    activate: jest.fn(),
    end: jest.fn(),
    fail: jest.fn()
  };

  const handleTouchStart = jest.fn(
    (_e: unknown, _k: unknown, _p: unknown, activate: () => void) => {
      if (pickUpKey !== undefined) {
        activeItemKey.value = pickUpKey;
        activate();
      }
    }
  );

  mockedUseCommonValuesContext.mockReturnValue({ activeItemKey });
  mockedUseDragContext.mockReturnValue({
    handleDragEnd: jest.fn(() => {
      activeItemKey.value = null;
    }),
    handleTouchesMove: jest.fn(),
    handleTouchStart
  });

  renderHook(() => useItemPanGesture(KEY, makeMutable(0)));

  const [callbacks] = mockedUseDragGesture.mock.calls[0] as [
    ManualGestureCallbacks
  ];

  return { activeItemKey, callbacks, control, handleTouchStart };
};

it('fails the drag gesture on touch up when the item was never picked up', () => {
  // Regression: ending a Manual gesture marks it recognized, and on iOS that
  // cancels the touches already delivered to the views below, swallowing a
  // press on any button inside the item.
  // https://github.com/MatiPl01/react-native-sortables/issues/617
  const { callbacks, control } = setup();

  callbacks.onTouchesDown(EVENT, control);
  callbacks.onTouchesUp(EVENT, control);

  expect(control.fail).toHaveBeenCalledTimes(1);
  expect(control.end).not.toHaveBeenCalled();
});

it('ends the drag gesture on touch up when the item was picked up', () => {
  const { callbacks, control } = setup(KEY);

  callbacks.onTouchesDown(EVENT, control);
  callbacks.onTouchesUp(EVENT, control);

  expect(control.end).toHaveBeenCalledTimes(1);
  expect(control.fail).not.toHaveBeenCalled();
});

it('fails the drag gesture on touch up when another item is the active one', () => {
  const { callbacks, control } = setup('other-item');

  callbacks.onTouchesDown(EVENT, control);
  callbacks.onTouchesUp(EVENT, control);

  expect(control.fail).toHaveBeenCalledTimes(1);
  expect(control.end).not.toHaveBeenCalled();
});

it('fails a later touch that does not pick the item up again', () => {
  // The drop clears the active key, so the next tap on the same item must not
  // end (and swallow) its gesture.
  const { activeItemKey, callbacks, control, handleTouchStart } = setup(KEY);

  callbacks.onTouchesDown(EVENT, control);
  callbacks.onTouchesUp(EVENT, control);
  expect(control.end).toHaveBeenCalledTimes(1);
  expect(activeItemKey.value).toBeNull();

  // The next touch ends before the activation delay passes.
  handleTouchStart.mockImplementation(() => undefined);
  callbacks.onTouchesDown(EVENT, control);
  callbacks.onTouchesUp(EVENT, control);

  expect(control.end).toHaveBeenCalledTimes(1);
  expect(control.fail).toHaveBeenCalledTimes(1);
});
