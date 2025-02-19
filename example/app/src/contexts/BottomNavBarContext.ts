import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export const BottomNavBarContext = createContext<{
  height: SharedValue<number>;
} | null>(null);

export function useBottomNavBarHeight() {
  const context = useContext(BottomNavBarContext);

  if (!context) {
    throw new Error('useBottomNavBarHeight must be used within a BottomNavBar');
  }

  return context.height;
}
