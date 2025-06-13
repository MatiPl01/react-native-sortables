import type { PropsWithChildren } from 'react';

import type { ItemContextType } from '../../types';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

type ItemContextProviderProps = PropsWithChildren<
  Pick<
    ItemContextType,
    'activationAnimationProgress' | 'gesture' | 'isActive'
  > & {
    itemKey: string;
  }
>;

const { ItemContextProvider, useItemContextContext: useItemContext } =
  createProvider('ItemContext', { guarded: true })<
    ItemContextProviderProps,
    ItemContextType
  >(({ activationAnimationProgress, gesture, isActive, itemKey }) => {
    const {
      activationState,
      activeItemKey,
      indexToKey,
      keyToIndex,
      prevActiveItemKey
    } = useCommonValuesContext();

    return {
      value: {
        activationAnimationProgress,
        activationState,
        activeItemKey,
        gesture,
        indexToKey,
        isActive,
        itemKey,
        keyToIndex,
        prevActiveItemKey
      }
    };
  });

export { ItemContextProvider, useItemContext };
