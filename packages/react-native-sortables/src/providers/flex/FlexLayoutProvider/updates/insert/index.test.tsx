import { act, render } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Sortable, { useCommonValuesContext } from '../../../../../index';
import type { OrderUpdater, Vector } from '../../../../../types';
import useInsertStrategy from '.';

const ITEM_HEIGHT = 50;

type Options = {
  columnGap?: number;
  fixedIndex?: Array<number> | number;
  heights?: Array<number>;
  rowGap?: number;
};

// Renders a wrapping row of items with the given widths and returns their keys
// with functions that drag one of them.
const setup = (
  widths: Array<number>,
  containerWidth: number,
  { columnGap, fixedIndex = [], heights, rowGap }: Options = {}
) => {
  const fixedIndexes = [fixedIndex].flat();
  const heightOf = (index: number) => heights?.[index] ?? ITEM_HEIGHT;

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
            mode={fixedIndexes.includes(index) ? 'fixed-order' : 'draggable'}
          />
        ))}
      </Sortable.Flex>
    </GestureHandlerRootView>
  );

  const keys = context.indexToKey.value;
  act(() => {
    context.containerWidth.value = containerWidth;
    context.itemHeights.value = Object.fromEntries(
      keys.map((key, index) => [key, heightOf(index)])
    );
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
        dimensions: {
          height: heightOf(activeIndex),
          width: widths[activeIndex]!
        },
        position
      }) ?? keys
    );
  };

  const applyOrder = (order: Array<string>) =>
    act(() => {
      context.indexToKey.value = order;
      jest.runAllTimers();
    });

  // Keeps the item at the given position, applies every order the strategy
  // returns (as when the finger moves by a pixel) and returns all of them
  const hold = (activeIndex: number, position: Vector) => {
    const activeKey = keys[activeIndex]!;
    act(() => {
      context.activeItemKey.value = activeKey;
      jest.runAllTimers();
    });
    const orders: Array<Array<string>> = [];
    for (let i = 0; i < 6; i++) {
      const order = updater({
        activeIndex: context.keyToIndex.value[activeKey]!,
        activeKey,
        dimensions: {
          height: heightOf(activeIndex),
          width: widths[activeIndex]!
        },
        position
      });
      if (!order) break;
      orders.push(order);
      applyOrder(order);
    }
    return orders;
  };

  return { context, drag, hold, keys };
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

describe('with the item held at one position', () => {
  it('settles above a tall fixed line', () => {
    // a b | C | d E, where C and E are fixed and C is 150 high
    const { hold, keys } = setup([150, 100, 300, 200, 50], 300, {
      fixedIndex: [2, 4],
      heights: [50, 50, 150, 50, 50]
    });
    const [a, b, c, d, e] = keys;

    expect(hold(3, { x: 100, y: 110 })).toEqual([
      [d, a, c, b, e],
      [a, d, c, b, e]
    ]);
  });

  it('settles above three fixed lines', () => {
    // a b | C | D | E | f G, where C, D, E and G are fixed
    const { hold, keys } = setup([150, 100, 300, 300, 300, 200, 50], 300, {
      fixedIndex: [2, 3, 4, 6]
    });
    const [a, b, c, d, e, f, g] = keys;

    expect(hold(5, { x: 100, y: 112 })).toEqual([
      [f, a, c, d, e, b, g],
      [a, f, c, d, e, b, g]
    ]);
  });

  it('settles when the item is wider than the container', () => {
    // a | b c | D | e, where D is fixed and 150 high
    const { hold, keys } = setup([200, 150, 100, 300, 320], 300, {
      fixedIndex: 3,
      heights: [50, 50, 50, 150, 50]
    });
    const [a, b, c, d, e] = keys;

    expect(hold(4, { x: 150, y: 160 })).toEqual([
      [a, e, b, d, c],
      [a, b, e, d, c]
    ]);
  });

  it('ends on the line under the pointer when lines have gaps', () => {
    // a | b | c | d | e | f g, the pointer is in the line of c
    const { hold, keys } = setup([100, 120, 140, 160, 100, 140, 40], 200, {
      columnGap: 16,
      rowGap: 8
    });
    const [a, b, c, d, e, f, g] = keys;

    expect(hold(6, { x: 6, y: 150 }).at(-1)).toEqual([a, b, c, g, d, e, f]);
  });
});
