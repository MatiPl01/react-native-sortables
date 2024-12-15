/* eslint-disable import/no-unused-modules */
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_ARRAY } from '../../../../../constants';
import { areArraysDifferent, reorderSwap } from '../../../../../utils';
import { useCommonValuesContext } from '../../../../shared';
import { useGridLayoutContext } from '../../GridLayoutProvider';
import { getColumnIndex } from '../../utils';
import { createGridStrategy } from './common';

/**
 * Returns an array of inactive item keys ordered in a useful way
 * for the swap strategy.
 *
 * When 5 is active:
 * | 0 | 1 | 2 | 3 |     | 0 | 1 | 2 | 3 |
 * | 4 | 5 | 6 | 7 | --> | 4 | 9 | 6 | 7 |
 * | 8 | 9 |10 |11 |     | 8 |13 |10 |11 |
 * |12 |13 |14 |15 |     |12 |15 |16 | <-- in the last row we can have anything
 *
 * It removes the active item and shifts items in the same column
 * to the top. Items in the last row are shifted to the left to fill
 * the blank space.
 */
function useInactiveIndexToKey() {
  const { activeItemKey, indexToKey, keyToIndex } = useCommonValuesContext();
  const { numColumns } = useGridLayoutContext();
  const result = useSharedValue<Array<string>>([]);

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      idxToKey: indexToKey.value,
      keyToIdx: keyToIndex.value
    }),
    ({ activeKey, idxToKey, keyToIdx }) => {
      const activeIndex = activeKey && keyToIdx[activeKey];

      if (activeKey === null || activeIndex === undefined) {
        result.value = EMPTY_ARRAY;
      } else {
        const othersArray = [...idxToKey];
        const activeIdx = activeIndex as number;

        for (
          let i = activeIdx;
          i + numColumns < othersArray.length;
          i += numColumns
        ) {
          othersArray[i] = othersArray[i + numColumns]!;
        }

        const activeColumnIndex = getColumnIndex(activeIdx, numColumns);
        const lastRowIndex = Math.floor((othersArray.length - 1) / numColumns);
        for (
          let i = lastRowIndex * numColumns + activeColumnIndex;
          i < othersArray.length;
          i++
        ) {
          othersArray[i] = othersArray[i + 1]!;
        }
        othersArray.pop();

        if (areArraysDifferent(othersArray, result.value)) {
          result.value = othersArray;
        }
      }
    }
  );

  return result;
}

export default createGridStrategy(useInactiveIndexToKey, reorderSwap);
