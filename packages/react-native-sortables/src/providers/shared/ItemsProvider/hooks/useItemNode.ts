import { useSyncExternalStore } from 'react';

import { useItemsContext } from '../ItemsProvider';

export default function useItemNode(itemKey: string) {
  const { getNode, subscribeItem } = useItemsContext();

  return useSyncExternalStore(
    callback => subscribeItem(itemKey, callback),
    () => getNode(itemKey),
    () => getNode(itemKey) // SSR fallback
  );
}
