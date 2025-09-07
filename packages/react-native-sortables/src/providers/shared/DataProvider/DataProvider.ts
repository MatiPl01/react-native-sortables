import type { PropsWithChildren, ReactNode } from 'react';
import { useCallback, useRef } from 'react';

import type { DraggableViewProps } from '../../../components';
import type { AnimatedStyleProp } from '../../../integrations/reanimated';
import type {
  DataContextType,
  DataState,
  DataSubscriber
} from '../../../types';
import { createProvider } from '../../utils';

type DataProviderProps<I> = PropsWithChildren<{
  items: Array<[string, I]>;
}>;

const { DataContext, DataProvider, useDataContext } = createProvider('Data')<
  DataProviderProps<unknown>,
  DataContextType
>(() => {
  const stateRef = useRef<DataState | null>(null);
  const subscribersRef = useRef<Set<DataSubscriber>>(new Set());

  const subscribe = useCallback((subscriber: DataSubscriber) => {
    subscribersRef.current.add(subscriber);
    return () => subscribersRef.current.delete(subscriber);
  }, []);

  const getStateData = useCallback(() => stateRef.current, []);

  return {
    value: { getData: getStateData, subscribe }
  };
});

type DataOutletProps = Omit<DraggableViewProps, 'children' | 'itemKey'> & {
  itemStyle?: AnimatedStyleProp;
};

function DataOutlet(props: DataOutletProps) {
  const { items } = useDataContext();

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
