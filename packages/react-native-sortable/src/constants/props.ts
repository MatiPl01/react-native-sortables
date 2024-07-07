import type { RequiredExcept, SharedProps } from '../types';

export const SHARED_PROPS: RequiredExcept<SharedProps, 'scrollableRef'> = {
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  autoScrollActivationOffset: 40,
  autoScrollEnabled: true,
  autoScrollSpeed: 0.5,
  dragEnabled: true,
  inactiveItemOpacity: 0.5,
  inactiveItemScale: 1,
  reorderStrategy: 'insert',
  scrollableRef: undefined
};
