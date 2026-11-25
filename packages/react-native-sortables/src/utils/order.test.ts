import type { DragEndParams } from '../types';
import { getKeyToIndex, orderItems } from './order';

const DATA = ['A', 'B', 'C', 'D'];
const ITEMS = DATA.map((item): [string, string] => [item, item]);

// The dragged item A is dropped at the index it was picked up from
const dropParams = (indexToKey: Array<string>): DragEndParams => ({
  fromIndex: 0,
  indexToKey,
  key: 'A',
  keyToIndex: getKeyToIndex(indexToKey),
  toIndex: 0
});

describe(orderItems, () => {
  it('returns the new order when only the other items changed places', () => {
    // e.g. A dragged around a 2x2 grid with the swap strategy, or the data
    // changed during the drag, which makes fromIndex stale
    const order = ['A', 'D', 'B', 'C'];

    expect(orderItems(DATA, ITEMS, dropParams(order), true)).toEqual(order);
  });

  it('returns the same data array when the order did not change', () => {
    expect(orderItems(DATA, ITEMS, dropParams(DATA), true)).toBe(DATA);
  });
});
