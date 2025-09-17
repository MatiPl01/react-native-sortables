import { memo, useLayoutEffect } from 'react';

import { useItemNode } from './hooks';

type ItemOutletProps = {
  itemKey: string;
  onUpdate?: () => void;
};

function ItemOutlet({ itemKey, onUpdate }: ItemOutletProps) {
  const node = useItemNode(itemKey);

  useLayoutEffect(() => {
    onUpdate?.();
  }, [node, onUpdate]);

  return node;
}

export default memo(ItemOutlet);
