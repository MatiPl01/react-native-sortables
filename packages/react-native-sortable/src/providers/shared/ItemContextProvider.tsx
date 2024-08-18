import type { PropsWithChildren } from 'react';
import { type SharedValue } from 'react-native-reanimated';

import type { DragActivationState } from '../../types';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

type ItemContextType = {
  position: {
    x: Readonly<SharedValue<null | number>>;
    y: Readonly<SharedValue<null | number>>;
  };
  pressProgress: Readonly<SharedValue<number>>;
  zIndex: Readonly<SharedValue<number>>;
  isTouched: Readonly<SharedValue<boolean>>;
  dragActivationState: Readonly<SharedValue<DragActivationState>>;
};

type ItemContextProviderProps = PropsWithChildren<
  {
    itemKey: string;
  } & Omit<ItemContextType, 'dragActivationState'>
>;

const { ItemContextProvider, useItemContextContext: useItemContext } =
  createProvider('ItemContext')<ItemContextProviderProps, ItemContextType>(
    props => {
      const { activationState } = useCommonValuesContext();

      return { value: { ...props, dragActivationState: activationState } };
    }
  );

export { ItemContextProvider, useItemContext };
