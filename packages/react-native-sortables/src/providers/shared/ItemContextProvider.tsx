import type { PropsWithChildren } from 'react';

import type { ItemContextType } from '../../types';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

type ItemContextProviderProps = PropsWithChildren<
  {
    itemKey: string;
  } & Omit<ItemContextType, 'dragActivationState'>
>;

const { ItemContextProvider, useItemContextContext: useItemContext } =
  createProvider('ItemContext', { guarded: true })<
    ItemContextProviderProps,
    ItemContextType
  >(props => {
    const { activationState } = useCommonValuesContext();

    return { value: { ...props, dragActivationState: activationState } };
  });

export { ItemContextProvider, useItemContext };
