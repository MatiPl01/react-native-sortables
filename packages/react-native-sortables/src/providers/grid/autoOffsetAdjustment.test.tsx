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

const touchEvent = (absoluteY: number, absoluteX = 10) =>
  ({
    allTouches: [{ absoluteX, absoluteY, id: 0, x: 10, y: 10 }]
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

const Grid = ({
  columns = 1,
  keys = KEYS
}: {
  columns?: number;
  keys?: Array<string>;
}) => (
  <GestureHandlerRootView>
    <Sortable.Grid
      columns={columns}
      data={keys}
      renderItem={() => <View />}
      strategy={useCapturingStrategy}
      autoAdjustOffsetDuringDrag
    />
  </GestureHandlerRootView>
);

function renderGrid() {
  const result = render(<Grid />);
  act(() => {
    common.containerWidth.value = 300;
  });
  setHeights(EXPANDED);
  advance(200); // absolute layout is enabled after a timeout
  return result;
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

function moveTo(absoluteY: number, absoluteX?: number) {
  act(() => {
    drag.handleTouchesMove(touchEvent(absoluteY, absoluteX), noop);
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

  it('shrinks the container when an item is removed after drags', () => {
    const { rerender } = renderGrid();
    dragAndDrop('a');
    dragAndDrop('a');

    rerender(<Grid keys={KEYS.slice(0, 3)} />);
    advance(0);

    expect(common.containerHeight.value).toBe(3 * EXPANDED);
  });

  it('shrinks the container when a reorder during the drag makes the grid shorter', () => {
    render(<Grid columns={2} keys={['a', 'b', 'c']} />);
    act(() => {
      common.containerWidth.value = 300;
      common.itemHeights.value = { a: 100, b: 100, c: 20 };
    });
    advance(200);

    startDrag('c', 110);
    moveTo(50, 225); // c takes the place of b, which moves to the second row
    expect(common.indexToKey.value).toEqual(['a', 'c', 'b']);
    expect(common.containerHeight.value).toBe(200);

    moveTo(110, 10);
    expect(common.indexToKey.value).toEqual(['a', 'b', 'c']);
    expect(common.containerHeight.value).toBe(120);
  });
});
