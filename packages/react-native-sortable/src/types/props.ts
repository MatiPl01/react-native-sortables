import type { AnimatedRef } from 'react-native-reanimated';

import type { AnimatableValues, Prettify } from './utils';

export type ActiveItemDecorationSettings = AnimatableValues<{
  activeItemScale: number;
  activeItemOpacity: number;
  activeItemShadowOpacity: number;
  inactiveItemOpacity: number;
  inactiveItemScale: number;
}>;

export type AutoScrollProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollableRef: AnimatedRef<any>; // TODO - type this properly
} & AnimatableValues<{
  offsetFromTop?: number;
  activationOffset?: [number, number] | number;
}>;

export type ReorderStrategy = 'insert' | 'swap';

export type SharedProps = Prettify<
  {
    dragEnabled?: boolean;
    reorderStrategy?: ReorderStrategy;
  } & Partial<ActiveItemDecorationSettings> &
    Partial<AutoScrollProps>
>;
