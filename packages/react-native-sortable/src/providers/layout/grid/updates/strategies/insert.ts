import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_ARRAY } from '../../../../../constants';
import { areArraysDifferent, reorderInsert } from '../../../../../utils';
import { useCommonValuesContext } from '../../../../shared';
import { createGridStrategy } from './common';

/**
 * Returns an array of inactive item keys ordered in a useful way
 * for the insert strategy.
 *
 * When 5 is active:
 * | 0 | 1 | 2 | 3 |     | 0 | 1 | 2 | 3 |
 * | 4 | 5 | 6 | 7 | --> | 4 | 6 | 7 | 8 |
 * | 8 | 9 |10 |11 |     | 9 |10 |11 |12 |
 * |12 |13 |14 |15 |     |13 |14 |15 |
 *
 * It removes the active item and shifts the other items one index
 * to the left.
 */
function useInactiveIndexToKey() {
  const { activeItemKey, indexToKey } = useCommonValuesContext();
  const result = useSharedValue<Array<string>>([]);

  useAnimatedReaction(
    () => ({
      excluded: activeItemKey.value,
      idxToKey: indexToKey.value
    }),
    ({ excluded, idxToKey }) => {
      if (excluded === null) {
        result.value = EMPTY_ARRAY;
      } else {
        const othersArray = idxToKey.filter(key => key !== excluded);
        if (areArraysDifferent(othersArray, result.value)) {
          result.value = othersArray;
        }
      }
    }
  );

  return result;
}

export default createGridStrategy(useInactiveIndexToKey, reorderInsert);
