import { useSyncExternalStore } from 'react';

import { error } from '../../utils';
import { store } from '../store';

export default function useStoreSelector<T>(key: string, fallback?: T): T {
  const subscribe = (cb: () => void) => store.subscribe(key, cb);

  const getSnapshot = () => {
    const snapshot = store.get<T>(key) ?? fallback;
    if (snapshot === undefined) {
      throw error(`No value found for key: ${key} in the store`);
    }
    return snapshot;
  };

  return useSyncExternalStore(subscribe, getSnapshot);
}
