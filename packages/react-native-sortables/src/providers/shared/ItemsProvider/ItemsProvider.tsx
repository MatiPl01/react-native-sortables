import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useState
} from 'react';

import type { ItemsContextType, RenderItem } from '../../../types';
import { createProvider } from '../../utils';
import { createItemsStore } from './store';

type ItemsProviderProps<I> = PropsWithChildren<{
  items: Array<[string, I]>;
  renderItem?: RenderItem<I>;
}>;

const { ItemsProvider, useItemsContext } = createProvider('Items')<
  ItemsProviderProps<unknown>,
  ItemsContextType
>(({ items, renderItem }) => {
  const [store] = useState(() => createItemsStore(items, renderItem));

  useEffect(() => {
    store.update(items, renderItem);
  }, [items, renderItem, store]);

  return {
    value: {
      getKeys: store.getKeys,
      getNode: store.getNode,
      subscribeItem: store.subscribeItem,
      subscribeKeys: store.subscribeKeys
    }
  };
});

const TypedItemsProvider = ItemsProvider as <I>(
  props: ItemsProviderProps<I>
) => ReactNode;

export { TypedItemsProvider as ItemsProvider, useItemsContext };
