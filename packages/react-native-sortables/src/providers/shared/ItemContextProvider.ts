import type { PropsWithChildren } from 'react';

import type { ItemContextType } from '../../types';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

type ItemContextProviderProps = PropsWithChildren<
  {
    itemKey: string;
  } & Pick<
    ItemContextType,
    'activationAnimationProgress' | 'gesture' | 'isActive'
  >
>;

const { ItemContextProvider, useItemContextContext: useItemContext } =
  createProvider('ItemContext', { guarded: true })<
    ItemContextProviderProps,
    ItemContextType
  >(props => {
    const { activationState, activeItemKey, prevActiveItemKey } =
      useCommonValuesContext();

    return {
      value: {
        ...props,
        activeItemKey,
        dragActivationState: activationState,
        prevActiveItemKey
      }
    };
  });

export { ItemContextProvider, useItemContext };
