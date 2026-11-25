import { act, render } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Sortable, { useCommonValuesContext } from '../../../../../index';
import type { OrderUpdater, Vector } from '../../../../../types';
import useInsertStrategy from '.';

const ITEM_HEIGHT = 50;

type Options = {
  fixedIndex?: number;
  rowGap?: number;
};

// Renders a wrapping row of items with the given widths and returns their keys
// with a function that drags one of them.
const setup = (
  widths: Array<number>,
  containerWidth: number,
  { fixedIndex, rowGap }: Options = {}
) => {
  let context!: ReturnType<typeof useCommonValuesContext>;
  let updater!: OrderUpdater;
  const useStrategy = () => {
    context = useCommonValuesContext();
    return (updater = useInsertStrategy());
  };

  render(
    <GestureHandlerRootView>
      <Sortable.Flex rowGap={rowGap} strategy={useStrategy} customHandle>
        {widths.map((_, index) => (
          <Sortable.Handle
            key={index}
            mode={index === fixedIndex ? 'fixed-order' : 'draggable'}
          />
        ))}
      </Sortable.Flex>
    </GestureHandlerRootView>
  );

  const keys = context.indexToKey.value;
  act(() => {
    context.containerWidth.value = containerWidth;
    context.itemHeights.value = ITEM_HEIGHT;
    context.itemWidths.value = Object.fromEntries(
      keys.map((key, index) => [key, widths[index]!])
    );
    jest.runAllTimers();
  });

  // Returns the order after dragging the item to the given position
  const drag = (activeIndex: number, position: Vector) => {
    const activeKey = keys[activeIndex]!;
    act(() => {
      context.activeItemKey.value = activeKey;
      jest.runAllTimers();
    });
    return (
      updater({
        activeIndex,
        activeKey,
        dimensions: { height: ITEM_HEIGHT, width: widths[activeIndex]! },
        position
      }) ?? keys
    );
  };

  return { context, drag, keys };
};

it('moves an item to the next line when rounded sizes overflow the line', () => {
  // a b c | d e f  ->  b c d | a e f
  const { drag, keys } = setup(Array<number>(6).fill(125.00001), 375);
  const [a, b, c, d, e, f] = keys;

  expect(drag(0, { x: 60, y: 75 })).toEqual([b, c, d, a, e, f]);
});

it('moves an item next to a fixed last item without replacing it', () => {
  // a b | c D  ->  b | c a D
  const { drag, keys } = setup([50, 200, 100, 50], 250, { fixedIndex: 3 });
  const [a, b, c, d] = keys;

  expect(drag(0, { x: 130, y: 75 })).toEqual([b, c, a, d]);
  // The fixed item cannot be passed
  expect(drag(0, { x: 240, y: 75 })).toEqual(keys);
});

it('keeps a fixed last item when the target line does not exist', () => {
  // a | b c | d | E: with b taken out, c joins a, so the layout has one line
  // less than the strategy expects
  const { drag, keys } = setup([220, 210, 70, 240, 90], 300, { fixedIndex: 4 });

  expect(drag(1, { x: 150, y: 125 })).toEqual(keys);
});
