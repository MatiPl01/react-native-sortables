import { act, render } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Sortable, { useCommonValuesContext } from '../../../../../index';
import type { OrderUpdater, Vector } from '../../../../../types';
import useInsertStrategy from '.';

const ITEM_HEIGHT = 50;

type Options = {
  columnGap?: number;
  fixedIndex?: number;
  rowGap?: number;
};

// Renders a wrapping row of items with the given widths and returns their keys
// with a function that drags one of them.
const setup = (
  widths: Array<number>,
  containerWidth: number,
  { columnGap, fixedIndex, rowGap }: Options = {}
) => {
  let context!: ReturnType<typeof useCommonValuesContext>;
  let updater!: OrderUpdater;
  const useStrategy = () => {
    context = useCommonValuesContext();
    return (updater = useInsertStrategy());
  };

  render(
    <GestureHandlerRootView>
      <Sortable.Flex
        columnGap={columnGap}
        rowGap={rowGap}
        strategy={useStrategy}
        customHandle>
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
  // The fixed item cannot be passed, so the slot before it is taken
  expect(drag(0, { x: 240, y: 75 })).toEqual([b, c, a, d]);
});

it('moves an item to the next line when the pointer is over its fixed last item', () => {
  // a b | c D  ->  a | c b D
  const { drag, keys } = setup([54, 298, 270, 48], 352, { fixedIndex: 3 });
  const [a, b, c, d] = keys;

  expect(drag(1, { x: 203, y: 75 })).toEqual([a, c, b, d]);
});

it('moves an item to the last line when only a fixed item can follow it', () => {
  // a b | c d | e F  ->  a b | c e | d F
  const { drag, keys } = setup([233, 129, 160, 154, 146, 58], 380, {
    fixedIndex: 5
  });
  const [a, b, c, d, e, f] = keys;

  expect(drag(3, { x: 263, y: 125 })).toEqual([a, b, c, e, d, f]);
});

describe('when taking the item out lets the next item join the previous line', () => {
  it('moves the first item of a line to the next line', () => {
    // a | b c d | e  ->  a c | d e | b
    const { drag, keys } = setup([220, 100, 60, 110, 180], 300);
    const [a, b, c, d, e] = keys;

    expect(drag(1, { x: 50, y: 125 })).toEqual([a, c, d, e, b]);
  });

  it('moves an item before a fixed last item', () => {
    // a | b c | d | E  ->  a c | d | b E
    const { drag, keys } = setup([220, 210, 70, 240, 90], 300, {
      fixedIndex: 4
    });
    const [a, b, c, d, e] = keys;

    expect(drag(1, { x: 150, y: 125 })).toEqual([a, c, d, b, e]);
  });
});

it('moves an item wider than the container to the previous line', () => {
  // a | b | c d  ->  b | a c d
  const { drag, keys } = setup([57, 368, 162, 35], 362);
  const [a, b, c, d] = keys;

  expect(drag(1, { x: 184, y: 40 })).toEqual([b, a, c, d]);
});

it('moves an item wider than half of the line to the end of the line', () => {
  const { drag, keys } = setup([200, 50, 50], 300);
  const [a, b, c] = keys;

  expect(drag(0, { x: 290, y: 25 })).toEqual([b, c, a]);
});

it('does not leave an empty line before a first item wider than the container', () => {
  const { context, keys } = setup([300, 80], 250, { rowGap: 12 });

  expect(context.itemLayoutPositions.value[keys[0]!]).toEqual({ x: 0, y: 0 });
});
