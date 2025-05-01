import type { ReactNode } from 'react';

import { useStoreSelector } from '../../../store';

type ItemOutletProps = {
  itemKey: string;
};

export default function ItemOutlet({ itemKey }: ItemOutletProps) {
  return useStoreSelector<ReactNode>(itemKey);
}
