import { useAnimatedReaction } from 'react-native-reanimated';

import { EMPTY_ARRAY } from '../../../../constants';
import { useMutableValue } from '../../../../integrations/reanimated';
import { areArraysDifferent, reorderInsert } from '../../../../utils';
import {
  useCommonValuesContext,
  useCustomHandleContext
} from '../../../shared';
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
  const { fixedItemKeys } = useCustomHandleContext() ?? {};
  const result = useMutableValue<Array<string>>(EMPTY_ARRAY);

  useAnimatedReaction(
    () => ({
      excludedKey: activeItemKey.value,
      fixedKeys: fixedItemKeys?.value,
      idxToKey: indexToKey.value
    }),
    ({ excludedKey, fixedKeys, idxToKey }) => {
      if (excludedKey === null) {
        result.value = EMPTY_ARRAY;
        return;
      }

      let othersArray: Array<string>;

      if (fixedKeys) {
        othersArray = [...idxToKey];
        let emptyIndex = idxToKey.indexOf(excludedKey);

        for (let i = emptyIndex + 1; i < idxToKey.length; i++) {
          const itemKey = idxToKey[i]!;
          if (!fixedKeys[itemKey]) {
            othersArray[emptyIndex] = itemKey;
            emptyIndex = i;
          }
        }

        // Remove the last empty slot and move all remaining items to the left
        othersArray.splice(emptyIndex, 1);
      } else {
        othersArray = idxToKey.filter(key => key !== excludedKey);
      }

      if (areArraysDifferent(result.value, othersArray)) {
        result.value = othersArray;
      }
    }
  );

  return result;
}

export default createGridStrategy(useInactiveIndexToKey, reorderInsert);
