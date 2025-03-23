import { createContext, useContext } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { IS_REACT_19 } from '@/constants';

const BottomNavBarHeightContext = createContext<SharedValue<number> | null>(
  null
);

export function useBottomNavBarHeight() {
  const value = useContext(BottomNavBarHeightContext);

  if (!value) {
    throw new Error(
      'useBottomNavBarHeight must be used within a BottomNavBarHeightProvider'
    );
  }

  return value;
}

export function BottomNavBarHeightProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const height = useSharedValue(0);

  const Provider = IS_REACT_19
    ? BottomNavBarHeightContext
    : BottomNavBarHeightContext.Provider;

  return <Provider value={height}>{children}</Provider>;
}
