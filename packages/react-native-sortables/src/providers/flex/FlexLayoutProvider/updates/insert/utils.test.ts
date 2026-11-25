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
