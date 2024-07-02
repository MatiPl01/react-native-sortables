import type { AnimatableValues, Prettify } from './utils';

export type ActiveItemDecorationSettings = AnimatableValues<{
  activeItemScale: number;
  activeItemOpacity: number;
  activeItemShadowOpacity: number;
  inactiveItemOpacity: number;
  inactiveItemScale: number;
}>;

export type ReorderStrategy = 'insert' | 'swap';

export type SharedProps = Prettify<
  {
    dragEnabled?: boolean;
    reorderStrategy?: ReorderStrategy;
  } & Partial<ActiveItemDecorationSettings>
>;
