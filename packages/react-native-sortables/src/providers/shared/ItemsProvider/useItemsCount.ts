import { useSyncExternalStore } from 'react';

import { useItemsContext } from './ItemsProvider';

export default function useItemsCount(): number {
  const { getKeys, subscribeKeys } = useItemsContext();

  return useSyncExternalStore(
    subscribeKeys,
    () => getKeys().length,
    () => getKeys().length // SSR fallback
  );
}
