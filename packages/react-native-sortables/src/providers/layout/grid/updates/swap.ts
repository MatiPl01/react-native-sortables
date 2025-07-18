import { useAnimatedReaction } from 'react-native-reanimated';

import { EMPTY_ARRAY } from '../../../../constants';
import { useMutableValue } from '../../../../integrations/reanimated';
import { areArraysDifferent, reorderSwap } from '../../../../utils';
import { useCommonValuesContext } from '../../../shared';
import { useGridLayoutContext } from '../GridLayoutProvider';
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
 * to the top. Remaining items are shifted to the left to fill
 * the blank space.
 *
 * The same applies to the horizontal grid but with direction changes.
 */
function useInactiveIndexToKey() {
  const { activeItemKey, indexToKey, keyToIndex } = useCommonValuesContext();
  const { numGroups } = useGridLayoutContext();
  const result = useMutableValue<Array<string>>(EMPTY_ARRAY);

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
      let i = excludedIndex;

      for (; i + numGroups < othersArray.length; i += numGroups) {
        othersArray[i] = othersArray[i + numGroups]!;
      }
      for (; i < othersArray.length; i++) {
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
