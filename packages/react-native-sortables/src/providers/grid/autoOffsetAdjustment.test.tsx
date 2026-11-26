import { act, render } from '@testing-library/react-native';
import { View } from 'react-native';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { makeMutable } from 'react-native-reanimated';

import Sortable from '../../index';
import type {
  CommonValuesContextType,
  DragContextType,
  SortStrategyFactory
} from '../../types';
import { useCommonValuesContext, useDragContext } from '../shared';
import { GRID_STRATEGIES } from './GridLayoutProvider';

const KEYS = ['a', 'b', 'c', 'd'];
const EXPANDED = 100;
const COLLAPSED = 40;

let common: CommonValuesContextType;
let drag: DragContextType;

// The strategy factory runs as a hook inside the provider tree, so it can
// hand the internal shared values and drag handlers over to the test
const useCapturingStrategy: SortStrategyFactory = () => {
  common = useCommonValuesContext();
  drag = useDragContext();
  return GRID_STRATEGIES.insert();
};

const noop = jest.fn();

const touchEvent = (absoluteY: number) =>
  ({
    allTouches: [{ absoluteX: 10, absoluteY, id: 0, x: 10, y: 10 }]
  }) as unknown as GestureTouchEvent;

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

const setHeights = (height: number) =>
  act(() => {
    common.itemHeights.value = Object.fromEntries(
      KEYS.map(key => [key, height])
    );
  });

function renderGrid() {
  render(
    <GestureHandlerRootView>
      <Sortable.Grid
        columns={1}
        data={KEYS}
        renderItem={() => <View />}
        strategy={useCapturingStrategy}
        autoAdjustOffsetDuringDrag
      />
    </GestureHandlerRootView>
  );
  act(() => {
    common.containerWidth.value = 300;
  });
  setHeights(EXPANDED);
  advance(200); // absolute layout is enabled after a timeout
}

function startDrag(key: string, absoluteY: number) {
  const progress = makeMutable(0);
  act(() => {
    drag.handleTouchStart(touchEvent(absoluteY), key, progress, noop, noop);
  });
  advance(300); // drag activation delay
  return progress;
}

function dragAndDrop(key: string) {
  const progress = startDrag(key, 10);
  act(() => {
    drag.handleDragEnd(key, progress);
  });
  advance(2000); // drop animation + autoAdjustOffsetResetTimeout
}

function moveTo(absoluteY: number) {
  act(() => {
    drag.handleTouchesMove(touchEvent(absoluteY), noop);
  });
  advance(50); // lets reactions settle
}

const getItemOffsets = () =>
  KEYS.map(key => common.itemLayoutPositions.value[key]?.y);

describe('Sortable.Grid autoAdjustOffsetDuringDrag', () => {
  it('reorders when no item changes size during the drag', () => {
    renderGrid();
    startDrag('a', 10);
    moveTo(260);

    expect(common.indexToKey.value).toEqual(['b', 'c', 'a', 'd']);
  });

  it('keeps sorting enabled when items are resized with no drag in progress', () => {
    renderGrid();
    const progress = startDrag('c', 210);
    setHeights(COLLAPSED); // items collapse on drag start
    act(() => {
      drag.handleDragEnd('c', progress);
    });
    setHeights(EXPANDED); // and expand again while the drop animates
    advance(2000);

    setHeights(COLLAPSED);

    expect(common.sortEnabled.value).toBe(true);
    expect(getItemOffsets()).toEqual([0, 40, 80, 120]);
  });

  it('keeps sorting enabled when items are resized after drags with no size change', () => {
    renderGrid();
    dragAndDrop('a');
    dragAndDrop('a');

    setHeights(COLLAPSED);

    expect(common.sortEnabled.value).toBe(true);
    expect(getItemOffsets()).toEqual([0, 40, 80, 120]);
  });

  it('keeps the released item in place when items are resized right after the release', () => {
    renderGrid();
    const progress = startDrag('c', 210);
    act(() => {
      drag.handleDragEnd('c', progress);
    });
    setHeights(COLLAPSED); // the state update from onDragStart lands late

    expect(getItemOffsets()).toEqual([120, 160, 200, 240]);

    setHeights(EXPANDED); // and items expand again after the drop
    advance(2000);

    expect(common.sortEnabled.value).toBe(true);
    expect(getItemOffsets()).toEqual([0, 100, 200, 300]);
  });

  it('adjusts the offset in a drag started before the previous drop finished', () => {
    renderGrid();
    const progress = startDrag('c', 210);
    setHeights(COLLAPSED); // items collapse on drag start
    act(() => {
      common.activeAnimationProgress.value = 1; // the drop takes its full time
      drag.handleDragEnd('c', progress);
    });
    setHeights(EXPANDED); // and expand again while the drop animates
    advance(50);

    startDrag('d', 310);
    setHeights(COLLAPSED);

    expect(getItemOffsets()[0]).toBeGreaterThan(0);
  });

  it('removes the offset from the layout when the reset timeout fires', () => {
    renderGrid();
    const progress = startDrag('c', 210);
    setHeights(COLLAPSED); // items collapse on drag start and stay collapsed
    expect(getItemOffsets()[0]).toBeGreaterThan(0);
    act(() => {
      drag.handleDragEnd('c', progress);
    });
    advance(2000); // drop animation + autoAdjustOffsetResetTimeout

    expect(getItemOffsets()).toEqual([0, 40, 80, 120]);

    startDrag('a', 10);
    moveTo(13);

    expect(common.indexToKey.value).toEqual(KEYS);
  });
});
