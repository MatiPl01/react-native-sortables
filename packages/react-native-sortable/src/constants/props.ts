import type { RequiredExcept, SharedProps } from '../types';

export const SHARED_PROPS: RequiredExcept<SharedProps, 'scrollableRef'> = {
  activationOffset: 20,
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  dragEnabled: true,
  inactiveItemOpacity: 0.5,
  inactiveItemScale: 1,
  offsetFromTop: 0,
  reorderStrategy: 'insert',
  scrollableRef: undefined
};
