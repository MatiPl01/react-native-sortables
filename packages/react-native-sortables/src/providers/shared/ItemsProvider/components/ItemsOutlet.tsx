import { memo, useSyncExternalStore } from 'react';

import type { DraggableViewProps } from '../../../../components';
import { DraggableView } from '../../../../components';
import type { AnimatedStyleProp } from '../../../../integrations/reanimated';
import { useItemsContext } from '../ItemsProvider';

type ItemsOutletProps = Pick<
  DraggableViewProps,
  'itemEntering' | 'itemExiting'
> & {
  itemStyle?: AnimatedStyleProp;
};

function ItemsOutlet({ itemStyle, ...rest }: ItemsOutletProps) {
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
}

export default memo(ItemsOutlet);
