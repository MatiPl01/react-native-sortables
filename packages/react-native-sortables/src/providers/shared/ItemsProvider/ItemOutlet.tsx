import { memo } from 'react';

import { useItemNode } from './hooks';

type ItemOutletProps = {
  itemKey: string;
};

function ItemOutlet({ itemKey }: ItemOutletProps) {
  return useItemNode(itemKey);
}

export default memo(ItemOutlet);
