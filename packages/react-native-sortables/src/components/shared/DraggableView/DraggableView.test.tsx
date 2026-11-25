import { act, render } from '@testing-library/react-native';
import { Activity } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Sortable from '../../../index';
import { GRID_STRATEGIES } from '../../../providers/grid/GridLayoutProvider';
import { useCommonValuesContext } from '../../../providers/shared';
import type {
  CommonValuesContextType,
  SortStrategyFactory
} from '../../../types';

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
};

const Screen = ({ keys = ['a', 'b'], mode = 'visible' }: ScreenProps) => (
  <Activity mode={mode}>
    <GestureHandlerRootView>
      <Sortable.Grid
        columns={1}
        data={keys}
        renderItem={() => <View />}
        strategy={useCapturingStrategy}
      />
    </GestureHandlerRootView>
  </Activity>
);

function renderScreen() {
  const result = render(<Screen />);
  act(() => {
    common.containerWidth.value = 300;
    common.itemHeights.value = { a: 100, b: 100 };
    jest.advanceTimersByTime(200);
  });
  return result;
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

  it('removes the measurements of an item that is no longer rendered', () => {
    const { rerender } = renderScreen();

    rerender(<Screen keys={['a']} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(common.itemHeights.value).toEqual({ a: 100 });
  });
});
