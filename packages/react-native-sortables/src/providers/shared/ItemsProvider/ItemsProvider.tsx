import {
  memo,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore
} from 'react';

import { DraggableView, type DraggableViewProps } from '../../../components';
import type { AnimatedStyleProp } from '../../../integrations/reanimated';
import type { ItemsContextType, RenderItem } from '../../../types';
import { createProvider } from '../../utils';
import { createItemsStore } from './store';

type ItemsProviderProps<I> = PropsWithChildren<{
  items: Array<[string, I]>;
  renderItem?: RenderItem<I>;
}>;

const { ItemsContext, ItemsProvider, useItemsContext } = createProvider(
  'Items'
)<ItemsProviderProps<unknown>, ItemsContextType>(({ items, renderItem }) => {
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

type ItemsOutletProps = Pick<
  DraggableViewProps,
  'itemEntering' | 'itemExiting'
> & {
  itemStyle?: AnimatedStyleProp;
};

const ItemsOutlet = memo(function ItemsOutlet({
  itemStyle,
  ...rest
}: ItemsOutletProps) {
  const { getKeys, subscribeKeys } = useItemsContext();

  // Re-render the list of cells only if the keys array changes
  const keys = useSyncExternalStore(
    subscribeKeys,
    getKeys,
    getKeys // SSR fallback
  );

  return keys.map(key => (
    <DraggableView {...rest} itemKey={key} key={key} style={itemStyle} />
  ));
});

type ItemOutletProps = {
  itemKey: string;
};

const ItemOutlet = memo(function ItemOutlet({ itemKey }: ItemOutletProps) {
  const { getNode, subscribeItem } = useItemsContext();

  // This outlet re-renders only when the item's node changes
  return useSyncExternalStore(
    callback => subscribeItem(itemKey, callback),
    () => getNode(itemKey),
    () => getNode(itemKey) // SSR fallback
  );
});

const TypedItemsProvider = ItemsProvider as <I>(
  props: ItemsProviderProps<I>
) => ReactNode;

export {
  ItemOutlet,
  ItemsContext,
  ItemsOutlet,
  TypedItemsProvider as ItemsProvider,
  useItemsContext
};
