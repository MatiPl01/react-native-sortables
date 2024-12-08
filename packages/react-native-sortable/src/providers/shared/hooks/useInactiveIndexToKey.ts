import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { areArraysDifferent } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useInactiveIndexToKey() {
  const { activeItemKey, indexToKey } = useCommonValuesContext();
  const result = useSharedValue<Array<string>>([]);

  useAnimatedReaction(
    () => ({
      excluded: activeItemKey.value,
      idxToKey: indexToKey.value
    }),
    ({ excluded, idxToKey }) => {
      if (excluded === null) {
        result.value = [];
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
