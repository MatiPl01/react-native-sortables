import { act, render } from '@testing-library/react-native';
import { View } from 'react-native';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { makeMutable } from 'react-native-reanimated';

import Sortable from '../../index';
import type {
  CommonValuesContextType,
  DragContextType,
  SortableGridProps,
  SortStrategyFactory
} from '../../types';
import { GRID_STRATEGIES } from '../grid/GridLayoutProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useDragContext } from './DragProvider';

const KEYS = ['a', 'b', 'c'];
const noop = jest.fn();

let common: CommonValuesContextType;
let drag: DragContextType;

// The strategy factory runs as a hook inside the provider tree, so it can
// hand the internal shared values and drag handlers over to the test
const useCapturingStrategy: SortStrategyFactory = () => {
  common = useCommonValuesContext();
  drag = useDragContext();
  return GRID_STRATEGIES.insert();
};

const touchEvent = {
  allTouches: [{ absoluteX: 10, absoluteY: 10, id: 0, x: 10, y: 10 }]
} as unknown as GestureTouchEvent;

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

function renderGrid(
  callbacks: Pick<
    SortableGridProps<string>,
    'onActiveItemDropped' | 'onDragEnd' | 'onDragStart'
  > = {}
) {
  render(
    <GestureHandlerRootView>
      <Sortable.Grid
        columns={3}
        data={KEYS}
        renderItem={() => <View />}
        strategy={useCapturingStrategy}
        {...callbacks}
      />
    </GestureHandlerRootView>
  );
  act(() => {
    common.containerWidth.value = 300;
    common.itemHeights.value = 100;
  });
  advance(200); // absolute layout is enabled after a timeout
}

function activate(key: string, sortable = { common, drag }) {
  const progress = makeMutable(0);
  act(() => {
    sortable.drag.handleTouchStart(touchEvent, key, progress, noop, noop);
  });
  // Stops right after the activation, before the delayed start callback
  for (let i = 0; i < 500 && sortable.common.activeItemKey.value !== key; i++) {
    advance(1);
  }
  return progress;
}

describe('DragProvider', () => {
  it('calls onDragStart before onDragEnd when the drag ends right away', () => {
    const calls: Array<[string, number]> = [];
    renderGrid({
      onDragEnd: ({ fromIndex }) => calls.push(['end', fromIndex]),
      onDragStart: ({ fromIndex }) => calls.push(['start', fromIndex])
    });

    const progress = activate('b');
    expect(common.activeItemKey.value).toBe('b');
    act(() => {
      drag.handleDragEnd('b', progress);
    });
    advance(1000);

    expect(calls).toEqual([
      ['start', 1],
      ['end', 1]
    ]);
  });

  it('calls onDragStart once when the drag ends after it was delivered', () => {
    const calls: Array<string> = [];
    renderGrid({
      onDragEnd: () => calls.push('end'),
      onDragStart: () => calls.push('start')
    });

    const progress = activate('b');
    advance(100); // the delayed start callback is called
    act(() => {
      drag.handleDragEnd('b', progress);
    });
    advance(1000);

    expect(calls).toEqual(['start', 'end']);
  });

  it('does not finish the previous drop while the next item is dragged', () => {
    renderGrid();

    const progress = activate('a');
    advance(300); // activation animation
    act(() => {
      drag.handleDragEnd('a', progress);
    });
    activate('b');
    advance(300); // the drop animation of the first item ends

    expect(common.activeItemKey.value).toBe('b');
    expect(common.activeItemDropped.value).toBe(false);
  });

  it('reports the order from the drag start when the drag ends right away', () => {
    const orders: Array<Array<string>> = [];
    renderGrid({
      onDragStart: ({ indexToKey }) => orders.push(indexToKey)
    });

    const progress = activate('a');
    act(() => {
      common.indexToKey.value = ['b', 'a', 'c']; // reordered before the end
      drag.handleDragEnd('a', progress);
    });
    advance(1000);

    expect(orders).toEqual([KEYS]);
  });

  it('finishes the drop only when the last dropped item is dropped', () => {
    const drops: Array<[string, boolean]> = [];
    renderGrid({
      onActiveItemDropped: ({ key }) =>
        drops.push([key, common.activeItemDropped.value])
    });

    const progressA = activate('a');
    advance(300); // activation animation
    act(() => {
      drag.handleDragEnd('a', progressA); // dropped after 300ms
    });
    const progressB = activate('b');
    advance(80);
    act(() => {
      drag.handleDragEnd('b', progressB); // dropped later than the first item
    });
    advance(1000);

    expect(drops).toEqual([
      ['a', false],
      ['b', true]
    ]);
  });

  it('does not share the drag state between sortables', () => {
    renderGrid();
    const first = { common, drag };
    renderGrid();
    const second = { common, drag };

    const progress = activate('a', first);
    advance(300); // activation animation
    act(() => {
      first.drag.handleDragEnd('a', progress); // dropped after 300ms
    });
    // A quick press and release in the other sortable in the meantime
    const otherProgress = activate('b', second);
    act(() => {
      second.drag.handleDragEnd('b', otherProgress);
    });
    advance(1000);

    expect(first.common.activeItemDropped.value).toBe(true);
  });
});
