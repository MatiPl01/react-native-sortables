import { act, render } from '@testing-library/react-native';
import { View } from 'react-native';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { makeMutable } from 'react-native-reanimated';

import Sortable from '../../../index';
import type {
  CommonValuesContextType,
  DragContextType,
  SortStrategyFactory
} from '../../../types';
import { LayerState } from '../../../types';
import { GRID_STRATEGIES } from '../../grid/GridLayoutProvider';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';
import useItemZIndex from './useItemZIndex';

const mockUpdateLayer = jest.fn();

jest.mock('../LayerProvider', () => ({
  ...jest.requireActual<object>('../LayerProvider'),
  useLayerContext: () => ({ updateLayer: mockUpdateLayer })
}));

const KEYS = ['a', 'b', 'c'];
const ORDER_Z_INDEX = 1;
const ACTIVE_Z_INDEX = 2 * KEYS.length + 1;

const noop = jest.fn();

let progress: SharedValue<number>;
let common: CommonValuesContextType;
let drag: DragContextType;
let zIndex: SharedValue<number>;

// The strategy factory runs as a hook inside the provider tree, so it can
// hand the internal shared values and drag handlers over to the test
const useCapturingStrategy: SortStrategyFactory = () => {
  common = useCommonValuesContext();
  drag = useDragContext();
  zIndex = useItemZIndex('b', progress);
  return GRID_STRATEGIES.insert();
};

const touchEvent = (absoluteX: number) =>
  ({
    allTouches: [{ absoluteX, absoluteY: 10, id: 0, x: 10, y: 10 }]
  }) as unknown as GestureTouchEvent;

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

function moveTo(absoluteX: number) {
  act(() => {
    drag.handleTouchesMove(touchEvent(absoluteX), noop);
  });
  advance(50); // lets reactions settle
}

function longPress() {
  render(
    <GestureHandlerRootView>
      <Sortable.Grid
        columns={3}
        data={KEYS}
        renderItem={() => <View />}
        strategy={useCapturingStrategy}
      />
    </GestureHandlerRootView>
  );
  act(() => {
    common.containerWidth.value = 300;
    common.itemHeights.value = 100;
  });
  advance(200); // absolute layout is enabled after a timeout
  act(() => {
    drag.handleTouchStart(touchEvent(150), 'b', progress, noop, noop);
  });
  advance(300); // drag activation delay
}

describe('useItemZIndex', () => {
  beforeEach(() => {
    progress = makeMutable(0);
    mockUpdateLayer.mockClear();
  });

  it('keeps the stacking order when the item is only long pressed', () => {
    longPress();
    expect(common.activeItemKey.value).toBe('b');

    moveTo(152); // finger jitter
    expect(zIndex.value).toBe(ORDER_Z_INDEX);

    act(() => {
      drag.handleDragEnd('b', progress);
    });
    advance(1000);

    expect(zIndex.value).toBe(ORDER_Z_INDEX);
    expect(mockUpdateLayer).not.toHaveBeenCalledWith(LayerState.FOCUSED);
    expect(mockUpdateLayer).not.toHaveBeenCalledWith(LayerState.INTERMEDIATE);
  });

  it('brings the item to front once it is dragged', () => {
    longPress();

    moveTo(160);

    expect(zIndex.value).toBe(ACTIVE_Z_INDEX);
    expect(mockUpdateLayer).toHaveBeenLastCalledWith(LayerState.FOCUSED);
  });

  it('keeps a dropped item above the others when the next drag starts', () => {
    longPress();
    moveTo(160);
    advance(300); // activation animation
    act(() => {
      drag.handleDragEnd('b', progress);
    });

    act(() => {
      drag.handleTouchStart(touchEvent(50), 'a', makeMutable(0), noop, noop);
    });
    advance(250); // 'a' is active, 'b' is still being dropped

    expect(common.activeItemKey.value).toBe('a');
    expect(zIndex.value).toBe(KEYS.length + ORDER_Z_INDEX);
  });
});
