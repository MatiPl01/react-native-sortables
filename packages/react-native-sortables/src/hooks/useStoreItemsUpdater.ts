/* eslint-disable import/no-unused-modules */
import { useRef } from 'react';

export default function useStoreItemsUpdater<I>(
  keys: Array<string>,
  items: Array<I>
) {
  const prevKeysRef = useRef<Array<string>>([]);

  childrenArray.forEach(([key, child]) => {
    store.set(key, child);
  });
  store.set('itemKeys', itemKeys);
  store.set('itemCount', itemKeys.length);

  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys;
      prevKeysRef.current = itemKeys;
    }
  }, [itemKeys, indexToKey]);
}
