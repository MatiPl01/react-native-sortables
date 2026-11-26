import { act, render } from '@testing-library/react-native';
import { View } from 'react-native';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { type AnimatedRef, makeMutable } from 'react-native-reanimated';

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

const mockScrollOffset = makeMutable(0);
const scrollableRef = { current: null } as unknown as AnimatedRef<View>;

// measure and scrollTo are not available in jest
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual<object>('react-native-reanimated'),
  __esModule: true,
  measure: () => null,
  scrollTo: () => undefined,
  useScrollViewOffset: () => mockScrollOffset
}));

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

type GridProps = {
  autoAdjustOffsetDuringDrag?: boolean;
  columns?: number;
  keys?: Array<string>;
  scrollable?: boolean;
  sortEnabled?: boolean;
};

const Grid = ({
  autoAdjustOffsetDuringDrag = true,
  columns = 1,
  keys = KEYS,
  scrollable,
  sortEnabled
}: GridProps) => (
  <GestureHandlerRootView>
    <Sortable.Grid
      autoAdjustOffsetDuringDrag={autoAdjustOffsetDuringDrag}
      columns={columns}
      data={keys}
      renderItem={() => <View />}
      scrollableRef={scrollable ? scrollableRef : undefined}
      sortEnabled={sortEnabled}
      strategy={useCapturingStrategy}
    />
  </GestureHandlerRootView>
);

function renderGrid(props?: GridProps) {
  const result = render(<Grid {...props} />);
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

// Sorting is locked while the offset is applied, so no drag can start then
const canStartDrag = () => {
  startDrag('a', 10);
  return common.activeItemKey.value === 'a';
};

describe('Sortable.Grid autoAdjustOffsetDuringDrag', () => {
  it('reorders when no item changes size during the drag', () => {
    renderGrid();
    startDrag('a', 10);
    moveTo(260);

    expect(common.indexToKey.value).toEqual(['b', 'c', 'a', 'd']);
  });

  it.each([
    ['without', false],
    ['with', true]
  ])(
    'keeps sorting enabled when items are resized with no drag in progress (%s scrollableRef)',
    (_, scrollable) => {
      renderGrid({ scrollable });
      const progress = startDrag('c', 210);
      setHeights(COLLAPSED); // items collapse on drag start
      act(() => {
        drag.handleDragEnd('c', progress);
      });
      setHeights(EXPANDED); // and expand again while the drop animates
      advance(2000);

      setHeights(COLLAPSED);

      expect(getItemOffsets()).toEqual([0, 40, 80, 120]);
      expect(canStartDrag()).toBe(true);
    }
  );

  it('keeps sorting enabled when items are resized after drags with no size change', () => {
    renderGrid();
    dragAndDrop('a');
    dragAndDrop('a');

    setHeights(COLLAPSED);

    expect(getItemOffsets()).toEqual([0, 40, 80, 120]);
    expect(canStartDrag()).toBe(true);
  });

  it('unlocks sorting when the adjustment is turned off with the offset applied', () => {
    const { rerender } = renderGrid();
    const progress = startDrag('c', 210);
    setHeights(COLLAPSED); // the offset is applied and sorting is locked
    act(() => {
      drag.handleDragEnd('c', progress);
    });

    rerender(<Grid autoAdjustOffsetDuringDrag={false} />);
    advance(200);
    setHeights(COLLAPSED); // the items were mounted again

    expect(canStartDrag()).toBe(true);
  });

  describe('when sortEnabled changes', () => {
    it('keeps sorting enabled when it is enabled after mount', () => {
      const { rerender } = renderGrid({ sortEnabled: false });
      rerender(<Grid sortEnabled />);
      advance(0);

      dragAndDrop('a');

      expect(canStartDrag()).toBe(true);
    });

    it('keeps sorting enabled when it is disabled only during the drag', () => {
      const { rerender } = renderGrid();
      const progress = startDrag('c', 210);
      rerender(<Grid sortEnabled={false} />); // disabled on drag start
      advance(0);
      setHeights(COLLAPSED);
      act(() => {
        drag.handleDragEnd('c', progress);
      });
      rerender(<Grid sortEnabled />); // and enabled again on drag end
      advance(0);
      setHeights(EXPANDED);
      advance(2000);

      expect(canStartDrag()).toBe(true);
    });

    it('keeps sorting disabled when it is disabled during the drag', () => {
      const { rerender } = renderGrid();
      const progress = startDrag('c', 210);
      setHeights(COLLAPSED);
      rerender(<Grid sortEnabled={false} />);
      advance(0);
      act(() => {
        drag.handleDragEnd('c', progress);
      });
      setHeights(EXPANDED);
      advance(2000);

      expect(canStartDrag()).toBe(false);
    });
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

    expect(getItemOffsets()).toEqual([0, 100, 200, 300]);
    expect(canStartDrag()).toBe(true);
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
    expect(canStartDrag()).toBe(false); // locked while the offset is applied
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

  it('shrinks the container when an item is removed right after the release', () => {
    const { rerender } = renderGrid();
    const progress = startDrag('d', 310);
    act(() => {
      drag.handleDragEnd('d', progress);
    });

    rerender(<Grid keys={KEYS.slice(0, 3)} />);
    advance(50);

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
