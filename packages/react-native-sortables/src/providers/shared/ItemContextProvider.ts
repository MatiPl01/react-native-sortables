import type { PropsWithChildren } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

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
      activeItemBroughtToFront,
      activeItemKey,
      indexToKey,
      keyToIndex,
      prevActiveItemKey
    } = useCommonValuesContext();

    const isDragging = useDerivedValue(
      () => isActive.value && activeItemBroughtToFront.value
    );

    return {
      value: {
        activationAnimationProgress,
        activationState,
        activeItemKey,
        gesture,
        indexToKey,
        isActive,
        isDragging,
        itemKey,
        keyToIndex,
        prevActiveItemKey
      }
    };
  });

export { ItemContextProvider, useItemContext };
