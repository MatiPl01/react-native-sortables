export type ActiveItemDecorationSettings = {
  activeItemScale: number;
  activeItemOpacity: number;
  activeItemShadowOpacity: number;
  inactiveItemOpacity: number;
  inactiveItemScale: number;
};

export type SharedProps = {
  dragEnabled?: boolean;
} & Partial<ActiveItemDecorationSettings>;
