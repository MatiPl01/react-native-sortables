import type { PropsWithChildren, ReactNode } from 'react';

import type { DraggableViewProps } from '../../../components';
import type { AnimatedStyleProp } from '../../../integrations/reanimated';
import type { DataContextType } from '../../../types';
import { createProvider } from '../../utils';

type DataProviderProps<I> = PropsWithChildren<{
  items: Array<[string, I]>;
}>;

const { DataContext, DataProvider, useDataContext } = createProvider('Data')<
  DataProviderProps<unknown>,
  DataContextType
>(({ items }) => {
  return {};
});

type DataOutletProps = Pick<
  DraggableViewProps,
  'itemEntering' | 'itemExiting' | 'itemKey'
> & {
  itemStyle?: AnimatedStyleProp;
};

function DataOutlet(props: DataOutletProps) {
  return null;
}

type DataItemOutletProps = {
  itemKey: string;
};

function DataItemOutlet({ itemKey }: DataItemOutletProps) {
  return null;
}

const TypedDataProvider = DataProvider as <I>(
  props: DataProviderProps<I>
) => ReactNode;

export {
  DataContext,
  DataItemOutlet,
  DataOutlet,
  TypedDataProvider as DataProvider,
  useDataContext
};
