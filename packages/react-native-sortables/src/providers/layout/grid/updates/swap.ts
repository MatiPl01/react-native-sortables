import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_ARRAY } from '../../../../constants';
import { areArraysDifferent, reorderSwap } from '../../../../utils';
import { useCommonValuesContext } from '../../../shared';
import { useGridLayoutContext } from '../GridLayoutProvider';
import { getMainIndex } from '../utils';
import { createGridStrategy } from './common';

/**
 * Returns an array of inactive item keys ordered in a useful way
 * for the swap strategy.
 *
 * When 5 is active:
 * | 0 | 1 | 2 | 3 |     | 0 | 1 | 2 | 3 |
 * | 4 | 5 | 6 | 7 | --> | 4 | 9 | 6 | 7 |
 * | 8 | 9 |10 |11 |     | 8 |13 |10 |11 |
 * |12 |13 |14 |15 |     |12 |14 |15 | <-- in the last row we can have anything
 *
 * It removes the active item and shifts items in the same column
 * to the top. Items in the last row are shifted to the left to fill
 * the blank space.
 *
 * The same applies to the horizontal grid but ... // TODO
 */
function useInactiveIndexToKey() {
  const { activeItemKey, indexToKey, keyToIndex } = useCommonValuesContext();
  const { numGroups } = useGridLayoutContext();
  const result = useSharedValue<Array<string>>(EMPTY_ARRAY);

  useAnimatedReaction(
    () => ({
      excludedKey: activeItemKey.value,
      idxToKey: indexToKey.value,
      keyToIdx: keyToIndex.value
    }),
    ({ excludedKey, idxToKey, keyToIdx }) => {
      const excludedIndex = excludedKey ? keyToIdx[excludedKey] : undefined;
      if (excludedIndex === undefined) {
        result.value = EMPTY_ARRAY;
        return;
      }

      const othersArray = [...idxToKey];

      for (
        let i = excludedIndex;
        i + numGroups < othersArray.length;
        i += numGroups
      ) {
        othersArray[i] = othersArray[i + numGroups]!;
      }

      const activeColumnIndex = getMainIndex(excludedIndex, numGroups);
      const lastRowIndex = Math.floor((othersArray.length - 1) / numGroups);
      for (
        let i = lastRowIndex * numGroups + activeColumnIndex;
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
  );

  return result;
}

export default createGridStrategy(useInactiveIndexToKey, reorderSwap);
