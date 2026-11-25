import { act, fireEvent, render } from '@testing-library/react-native';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Sortable from '../index';
import { GRID_STRATEGIES, useCommonValuesContext } from '../providers';
import type { CommonValuesContextType, SortStrategyFactory } from '../types';
import ItemCell from './shared/DraggableView/ItemCell';

let common: CommonValuesContextType;

// The strategy factory runs as a hook inside the provider tree, so it can
// hand the internal shared values over to the test
const useCapturingStrategy: SortStrategyFactory = () => {
  common = useCommonValuesContext();
  return GRID_STRATEGIES.insert();
};

const runTimers = () =>
  act(() => {
    jest.runAllTimers();
  });

const Grid = ({ rows }: { rows: number }) => (
  <GestureHandlerRootView>
    <Sortable.Grid
      data={['a', 'b', 'c', 'd']}
      renderItem={() => <View />}
      rowHeight={50}
      rows={rows}
      strategy={useCapturingStrategy}
    />
  </GestureHandlerRootView>
);

it('lays out a horizontal grid again when the number of rows changes', () => {
  const { rerender, UNSAFE_root: root } = render(<Grid rows={1} />);
  // Items report their size only once, as it doesn't change with rows
  root.findAllByType(ItemCell).forEach(cell =>
    fireEvent(cell, 'layout', {
      nativeEvent: { layout: { height: 50, width: 100 } }
    })
  );
  runTimers();
  expect(common.itemLayoutPositions.value.d).toEqual({ x: 300, y: 0 });

  rerender(<Grid rows={2} />);
  runTimers();

  expect(common.itemLayoutPositions.value).toEqual({
    a: { x: 0, y: 0 },
    b: { x: 0, y: 50 },
    c: { x: 100, y: 0 },
    d: { x: 100, y: 50 }
  });
});
