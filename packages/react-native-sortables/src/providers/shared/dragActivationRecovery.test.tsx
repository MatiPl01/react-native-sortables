import { act, render } from '@testing-library/react-native';
import { View } from 'react-native';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { makeMutable } from 'react-native-reanimated';

import Sortable from '../../index';
import type { DragContextType } from '../../types';
import { DragActivationState } from '../../types';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useDragContext } from './DragProvider';
import { useItemContext } from './ItemContextProvider';

const KEYS = ['a', 'b', 'c'];
const ITEM_SIZE = 100;

type Common = ReturnType<typeof useCommonValuesContext>;

let common: Common;
let drag: DragContextType;
let progresses: Record<string, SharedValue<number>>;

function ItemProbe({ itemKey }: { itemKey: string }) {
  const { activationAnimationProgress } = useItemContext();
  common = useCommonValuesContext();
  drag = useDragContext();
  // The item context exposes it read-only; the gesture callbacks pass the very
  // same mutable value to the drag handlers.
  progresses[itemKey] = activationAnimationProgress as SharedValue<number>;
  return <View style={{ height: ITEM_SIZE, width: ITEM_SIZE }} />;
}

const onDragEnd = jest.fn();
const onActiveItemDropped = jest.fn();

function renderGrid() {
  progresses = {};
  const tree = render(
    <GestureHandlerRootView>
      <Sortable.Grid
        columns={2}
        data={KEYS}
        renderItem={({ item }) => <ItemProbe itemKey={item} />}
        onActiveItemDropped={onActiveItemDropped}
        onDragEnd={onDragEnd}
      />
    </GestureHandlerRootView>
  );

  // The absolute layout latch and the measurements are normally set by
  // onLayout, which never fires under jest - prime them by hand so activation
  // is not blocked by missing geometry.
  act(() => {
    common.sortEnabled.value = true;
    common.usesAbsoluteLayout.value = true;
    common.itemWidths.value = ITEM_SIZE;
    common.itemHeights.value = ITEM_SIZE;
    common.itemLayoutPositions.value = {
      a: { x: 0, y: 0 },
      b: { x: ITEM_SIZE, y: 0 },
      c: { x: 0, y: ITEM_SIZE }
    };
  });

  return tree;
}

// Shaped like the event gesture-handler delivers to onTouchesDown.
function touchEvent(x = 10, y = 10): GestureTouchEvent {
  return {
    allTouches: [{ absoluteX: x, absoluteY: y, id: 0, x, y }],
    changedTouches: [],
    handlerTag: 1,
    numberOfTouches: 1,
    state: 2
  } as unknown as GestureTouchEvent;
}

// A second finger landing on a handler that already tracks one.
function twoFingerTouchEvent(): GestureTouchEvent {
  return {
    allTouches: [
      { absoluteX: 10, absoluteY: 10, id: 0, x: 10, y: 10 },
      { absoluteX: 30, absoluteY: 30, id: 1, x: 30, y: 30 }
    ],
    changedTouches: [],
    handlerTag: 1,
    numberOfTouches: 2,
    state: 2
  } as unknown as GestureTouchEvent;
}

/** A finger goes down on `key` and stays down past the activation delay. */
function touchDown(key: string) {
  const activate = jest.fn();
  const fail = jest.fn();
  const progress = progresses[key] ?? makeMutable(0);

  act(() => {
    drag.handleTouchStart(touchEvent(), key, progress, activate, fail);
  });
  act(() => {
    jest.advanceTimersByTime(500);
  });

  return { activate, fail };
}

/** gesture-handler replaying onTouchesDown for a finger that is already down. */
function replayTouchDown(
  key: string,
  activate: () => void = jest.fn(),
  fail: () => void = jest.fn()
) {
  act(() => {
    jest.advanceTimersByTime(50);
    drag.handleTouchStart(touchEvent(), key, progresses[key]!, activate, fail);
  });
}

/** The finger is lifted normally - what onTouchesUp does. */
function touchUp(key: string) {
  act(() => {
    drag.handleDragEnd(key, progresses[key]!);
    jest.advanceTimersByTime(1000);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

it('activates an item on a normal press', () => {
  renderGrid();

  const { activate, fail } = touchDown('a');

  expect(activate).toHaveBeenCalledTimes(1);
  expect(fail).not.toHaveBeenCalled();
  expect(common.activeItemKey.value).toBe('a');
});

it('activates again after a normal drag ends', () => {
  renderGrid();

  touchDown('a');
  touchUp('a');

  expect(common.activeItemKey.value).toBeNull();
  expect(touchDown('a').activate).toHaveBeenCalledTimes(1);
});

// The reported "dead tile": no up/cancel callback is ever delivered, so the
// container still believes the item is being dragged. The replacement
// gesture's own touch up is what clears it.
it('recovers when the active item gesture dies without delivering a callback', () => {
  renderGrid();

  touchDown('a');
  expect(common.activeItemKey.value).toBe('a');

  // The gesture dies here - no onTouchesUp, no onTouchesCancelled, no
  // onFinalize (a native detach emits none of them).

  touchDown('a');
  touchUp('a');

  expect(common.activeItemKey.value).toBeNull();
  expect(touchDown('a').activate).toHaveBeenCalledTimes(1);
});

// A remount hands the item a fresh activation progress while the container
// still points at it, so the container stops sorting with nothing on screen
// to show for it.
it('recovers an item that is still the active one after remounting', () => {
  renderGrid();

  touchDown('a');
  act(() => {
    progresses.a!.value = 0;
  });
  expect(common.activeItemKey.value).toBe('a');

  expect(touchDown('a').activate).toHaveBeenCalledTimes(1);
});

// Discarding the drag on every replay would make dragging impossible under
// render churn.
it('keeps the drag running when its touch stream is replayed mid-drag', () => {
  renderGrid();

  touchDown('a');

  for (let i = 0; i < 5; i++) replayTouchDown('a');

  expect(common.activeItemKey.value).toBe('a');
  expect(common.activationState.value).toBe(DragActivationState.ACTIVE);
  expect(progresses.a!.value).toBeGreaterThan(0);
});

// Both a touch callback and onFinalize can clean up the same gesture, and
// Android can even emit onFinalize twice, so repeats must be harmless.
it('reports a drag end once however many times the gesture cleans up', () => {
  renderGrid();

  touchDown('a');
  onDragEnd.mockClear();

  touchUp('a');
  act(() => {
    drag.handleDragEnd('a', progresses.a!);
    drag.handleDragEnd('a', progresses.a!);
    jest.advanceTimersByTime(1000);
  });

  expect(onDragEnd).toHaveBeenCalledTimes(1);
  expect(common.activeItemKey.value).toBeNull();
});

// Reporting a drag that never happened would commit a bogus reorder.
it('recovers without reporting a drag end to the caller', () => {
  renderGrid();

  touchDown('a');
  onDragEnd.mockClear();
  onActiveItemDropped.mockClear();

  touchDown('a');

  expect(onDragEnd).not.toHaveBeenCalled();
  expect(onActiveItemDropped).not.toHaveBeenCalled();
});

it('recovers again when the gesture dies a second time', () => {
  renderGrid();

  for (let i = 0; i < 3; i++) {
    touchDown('a');
    touchDown('a');
    touchUp('a');
    expect(common.activeItemKey.value).toBeNull();
  }

  expect(touchDown('a').activate).toHaveBeenCalledTimes(1);
});

it('keeps the drag alive when a second finger lands on the dragged item', () => {
  renderGrid();

  touchDown('a');

  act(() => {
    drag.handleTouchStart(
      twoFingerTouchEvent(),
      'a',
      progresses.a!,
      jest.fn(),
      jest.fn()
    );
    jest.advanceTimersByTime(500);
  });

  expect(common.activeItemKey.value).toBe('a');
  expect(common.activationState.value).toBe(DragActivationState.ACTIVE);
});

// A progress too small to see still fails the gate, so the item looks
// completely normal and simply stops responding.
it('recovers an item left with a non-zero activation progress', () => {
  renderGrid();

  act(() => {
    progresses.b!.value = 0.4;
  });

  expect(touchDown('b').activate).toHaveBeenCalledTimes(1);
});

it('recovers every item when they all kept a non-zero activation progress', () => {
  renderGrid();

  act(() => {
    for (const key of KEYS) progresses[key]!.value = 0.05;
  });

  for (const key of KEYS) {
    expect(touchDown(key).activate).toHaveBeenCalledTimes(1);
    touchUp(key);
  }
});

// activeItemDropped stays false for the whole drop animation.
it('still refuses to re-grab an item while its drop animation is running', () => {
  renderGrid();

  touchDown('a');
  act(() => {
    drag.handleDragEnd('a', progresses.a!);
  });

  expect(common.activeItemDropped.value).toBe(false);
  expect(progresses.a!.value).toBeGreaterThan(0);
  expect(touchDown('a').activate).not.toHaveBeenCalled();
});

// Re-arming on every replay pushes activation out of reach, and leaves no
// visual trace because no drag state is ever written.
it('activates on schedule while the touch stream is replayed', () => {
  renderGrid();

  const activate = jest.fn();
  const fail = jest.fn();
  act(() => {
    drag.handleTouchStart(touchEvent(), 'a', progresses.a!, activate, fail);
  });

  // Replays arriving faster than the 200ms activation delay, for ten times as
  // long as that delay - the finger is down the whole time.
  for (let i = 0; i < 40; i++) replayTouchDown('a', activate, fail);

  expect(activate).toHaveBeenCalled();
  expect(common.activeItemKey.value).toBe('a');
});

// onFinalize makes handleDragEnd run on every failed touch, so a sibling
// revoking the pending activation would fire often.
it('keeps a pending activation when another item ends its gesture', () => {
  renderGrid();

  const activate = jest.fn();
  const fail = jest.fn();
  act(() => {
    drag.handleTouchStart(touchEvent(), 'a', progresses.a!, activate, fail);
  });

  act(() => {
    drag.handleDragEnd('b', progresses.b!);
    jest.advanceTimersByTime(500);
  });

  expect(activate).toHaveBeenCalledTimes(1);
  expect(common.activeItemKey.value).toBe('a');
});

it('fails the gesture when the item has no measured position', () => {
  renderGrid();

  const { activate, fail } = touchDown('never-measured');

  expect(activate).not.toHaveBeenCalled();
  expect(fail).toHaveBeenCalled();
});

// Otherwise the timeout later activates an item with no finger down.
it('does not activate an item whose touch died before the activation delay', () => {
  renderGrid();

  const activate = jest.fn();
  const fail = jest.fn();
  act(() => {
    drag.handleTouchStart(touchEvent(), 'a', progresses.a!, activate, fail);
  });

  // The gesture is torn down here, before the delay elapses.
  act(() => {
    drag.handleDragEnd('a', progresses.a!);
  });

  act(() => {
    jest.advanceTimersByTime(500);
  });

  expect(activate).not.toHaveBeenCalled();
  expect(common.activeItemKey.value).toBeNull();
});
