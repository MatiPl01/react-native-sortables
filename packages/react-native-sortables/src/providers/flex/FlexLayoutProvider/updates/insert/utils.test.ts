import { getKeyToIndex } from '../../../../../utils';
import { getSwappedToGroupAfterIndices } from './utils';

it.each([
  // a b | c d  ->  b | c a | d
  [undefined, ['b', 'c', 'a', 'd']],
  // a B | c d  ->  c | B a | d (the fixed B keeps its index)
  [{ b: true }, ['c', 'b', 'a', 'd']]
])(
  'returns the in-group index of an item moved to the next group (fixed keys: %j)',
  (fixedKeys, expectedOrder) => {
    const indexToKey = ['a', 'b', 'c', 'd'];

    expect(
      getSwappedToGroupAfterIndices({
        activeItemIndex: 0,
        activeItemKey: 'a',
        currentGroupIndex: 0,
        fixedKeys,
        groupSizeLimit: 250,
        indexToKey,
        itemGroups: [
          ['a', 'b'],
          ['c', 'd']
        ],
        keyToIndex: getKeyToIndex(indexToKey),
        mainGap: 0,
        mainItemSizes: { a: 50, b: 200, c: 180, d: 60 }
      })
    ).toMatchObject({
      groupIndex: 1,
      indexToKey: expectedOrder,
      itemIndex: 2,
      itemIndexInGroup: 1
    });
  }
);

it('keeps an item wider than the limit in the line it starts', () => {
  // a | B | c  ->  B | a c (B is wider than the limit and never wraps alone)
  const indexToKey = ['a', 'b', 'c'];

  expect(
    getSwappedToGroupAfterIndices({
      activeItemIndex: 0,
      activeItemKey: 'a',
      currentGroupIndex: 0,
      fixedKeys: undefined,
      groupSizeLimit: 100,
      indexToKey,
      itemGroups: [['a'], ['b'], ['c']],
      keyToIndex: getKeyToIndex(indexToKey),
      mainGap: 0,
      mainItemSizes: { a: 40, b: 120, c: 40 }
    })
  ).toMatchObject({ groupIndex: 1, itemIndex: 1 });
});

it('wraps an item wider than the limit after an item without a size', () => {
  // a z | B  ->  z | B | a (z has no size, but B still cannot join its line)
  const indexToKey = ['a', 'z', 'b'];

  expect(
    getSwappedToGroupAfterIndices({
      activeItemIndex: 0,
      activeItemKey: 'a',
      currentGroupIndex: 0,
      fixedKeys: undefined,
      groupSizeLimit: 100,
      indexToKey,
      itemGroups: [['a', 'z'], ['b']],
      keyToIndex: getKeyToIndex(indexToKey),
      mainGap: 0,
      mainItemSizes: { a: 40, b: 120, z: 0 }
    })
  ).toMatchObject({ groupIndex: 2, itemIndex: 2 });
});
