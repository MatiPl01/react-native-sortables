import { act, render } from '@testing-library/react-native';
import { Activity } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Sortable from '../../../index';
import { GRID_STRATEGIES } from '../../../providers/grid/GridLayoutProvider';
import { useCommonValuesContext } from '../../../providers/shared';
import type {
  CommonValuesContextType,
  SortableGridRenderItem,
  SortStrategyFactory
} from '../../../types';
import type { ItemCellProps } from './ItemCell';
import ItemCell from './ItemCell';

type Root = ReturnType<typeof render>['UNSAFE_root'];

let common: CommonValuesContextType;

// The strategy factory runs as a hook inside the provider tree, so it can
// hand the internal shared values over to the test
const useCapturingStrategy: SortStrategyFactory = () => {
  common = useCommonValuesContext();
  return GRID_STRATEGIES.insert();
};

type ScreenProps = {
  keys?: Array<string>;
  mode?: 'hidden' | 'visible';
  renderItem?: SortableGridRenderItem<string>;
};

const Screen = ({
  keys = ['a', 'b'],
  mode = 'visible',
  renderItem = () => <View />
}: ScreenProps) => (
  <Activity mode={mode}>
    <GestureHandlerRootView>
      <Sortable.Grid
        columns={1}
        data={keys}
        renderItem={renderItem}
        strategy={useCapturingStrategy}
      />
    </GestureHandlerRootView>
  </Activity>
);

function renderScreen(props?: ScreenProps) {
  const result = render(<Screen {...props} />);
  act(() => {
    common.containerWidth.value = 300;
    common.itemHeights.value = { a: 100, b: 100 };
    jest.advanceTimersByTime(200);
  });
  return result;
}

// Reports the item size the way the native side does, through its onLayout
function reportItemLayout(root: Root, key: string) {
  const cell = root
    .findAllByType(ItemCell)
    .find(({ props }) => props.itemKey === key)!;
  act(() => {
    (cell.props as ItemCellProps).onLayout?.({
      nativeEvent: { layout: { height: 100, width: 300 } }
    } as LayoutChangeEvent);
    jest.advanceTimersByTime(200);
  });
}

describe('DraggableView', () => {
  it('keeps the item measurements when it is hidden and shown again', () => {
    const { rerender } = renderScreen();

    rerender(<Screen mode='hidden' />);
    rerender(<Screen mode='visible' />);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(common.itemHeights.value).toEqual({ a: 100, b: 100 });
  });

  it('lays out an item added after it is hidden and shown again', () => {
    const { rerender, UNSAFE_root: root } = render(<Screen />);
    act(() => {
      common.containerWidth.value = 300;
    });
    reportItemLayout(root, 'a');
    reportItemLayout(root, 'b');
    expect(common.containerHeight.value).toBe(200);

    rerender(<Screen mode='hidden' />);
    rerender(<Screen mode='visible' />);
    rerender(<Screen keys={['a', 'b', 'c']} />);
    reportItemLayout(root, 'c');

    expect(common.containerHeight.value).toBe(300);
  });

  it('keeps the measurements of an item rendered as undefined when it is hidden', () => {
    const renderItem: SortableGridRenderItem<string> = ({ item }) =>
      item === 'a' ? undefined : <View />;
    const { rerender } = renderScreen({ renderItem });

    rerender(<Screen mode='hidden' renderItem={renderItem} />);
    rerender(<Screen mode='visible' renderItem={renderItem} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(common.itemHeights.value).toEqual({ a: 100, b: 100 });
  });

  it('removes the measurements of an item that is no longer rendered', () => {
    const { rerender } = renderScreen();

    rerender(<Screen keys={['a']} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(common.itemHeights.value).toEqual({ a: 100 });
  });
});
