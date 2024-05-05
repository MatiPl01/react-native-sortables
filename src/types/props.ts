export type ActiveItemDecorationSettings = {
  activeItemScale: number;
  activeItemOpacity: number;
  activeItemShadowOpacity: number;
  inactiveItemOpacity: number;
  inactiveItemScale: number;
};

export type ReorderStrategy = 'insert' | 'swap';

export type SharedProps = {
  dragEnabled?: boolean;
  reorderStrategy?: ReorderStrategy;
} & Partial<ActiveItemDecorationSettings>;
