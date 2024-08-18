import type { PropsWithChildren } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { createProvider } from '../utils';

type ItemContextType = {
  position: {
    x: Readonly<SharedValue<null | number>>;
    y: Readonly<SharedValue<null | number>>;
  };
  pressProgress: Readonly<SharedValue<number>>;
  zIndex: Readonly<SharedValue<number>>;
  isTouched: Readonly<SharedValue<boolean>>;
};

type ItemContextProviderProps = PropsWithChildren<ItemContextType>;

const { ItemContextProvider, useItemContextContext: useItemContext } =
  createProvider('ItemContext')<ItemContextProviderProps, ItemContextType>(
    props => {
      return { value: props };
    }
  );

export { ItemContextProvider, useItemContext };
