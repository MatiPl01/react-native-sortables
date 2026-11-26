import { act, render } from '@testing-library/react-native';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { measure } from 'react-native-reanimated';

import { HIDDEN_X_OFFSET } from '../../constants';
import Sortable from '../../index';
import type {
  CommonValuesContextType,
  CustomHandleContextType,
  SortStrategyFactory
} from '../../types';
import { GRID_STRATEGIES } from '../grid/GridLayoutProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useCustomHandleContext } from './CustomHandleProvider';

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<{ default: unknown }>(
    'react-native-reanimated'
  );
  return {
    ...actual,
    __esModule: true,
    default: actual.default,
    measure: jest.fn()
  };
});

// Set by the tests, so that they don't depend on what isPaper detects under jest
let mockIsPaper = false;

jest.mock('../../constants/platform', () => ({
  ...jest.requireActual<object>('../../constants/platform'),
  isPaper: () => mockIsPaper
}));

const CONTAINER_X = 20;

let common: CommonValuesContextType;
let customHandle: CustomHandleContextType;

// The strategy factory runs as a hook inside the provider tree, so it can
// hand the internal shared values over to the test
const useCapturingStrategy: SortStrategyFactory = () => {
  common = useCommonValuesContext();
  customHandle = useCustomHandleContext()!;
  return GRID_STRATEGIES.insert();
};

function getHandleOffsetX(handlePageX: number) {
  render(
    <GestureHandlerRootView>
      <Sortable.Grid
        columns={1}
        data={['a']}
        strategy={useCapturingStrategy}
        renderItem={() => (
          <Sortable.Handle>
            <View />
          </Sortable.Handle>
        )}
        customHandle
      />
    </GestureHandlerRootView>
  );
  act(() => {
    common.containerWidth.value = 300;
    common.itemHeights.value = { a: 100 };
    jest.advanceTimersByTime(200);
  });
  jest
    .mocked(measure)
    .mockImplementation(ref =>
      (ref as unknown) === common.containerRef
        ? { height: 100, pageX: CONTAINER_X, pageY: 0, width: 300, x: 0, y: 0 }
        : { height: 20, pageX: handlePageX, pageY: 0, width: 20, x: 0, y: 0 }
    );

  act(() => {
    customHandle.updateActiveHandleMeasurements('a');
  });

  return customHandle.activeHandleOffset.value?.x;
}

describe('CustomHandleProvider', () => {
  it('calculates the handle offset relative to the item', () => {
    expect(getHandleOffsetX(50)).toBe(50 - CONTAINER_X);
  });

  it('handles a handle that is partly off the left edge of the screen', () => {
    expect(getHandleOffsetX(-30)).toBe(-30 - CONTAINER_X);
  });

  it('ignores the offset of an item that is hidden off the screen on Paper', () => {
    mockIsPaper = true;

    expect(getHandleOffsetX(HIDDEN_X_OFFSET + 50)).toBe(50 - CONTAINER_X);
  });

  it('keeps the offset of a handle far to the right when not on Paper', () => {
    mockIsPaper = false;

    expect(getHandleOffsetX(5050)).toBe(5050 - CONTAINER_X);
  });
});
