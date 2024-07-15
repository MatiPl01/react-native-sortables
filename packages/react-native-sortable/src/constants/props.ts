import { DefaultDropIndicator } from '../components';
import type { RequiredExcept, SharedProps } from '../types';

export const SHARED_PROPS: RequiredExcept<SharedProps, 'scrollableRef'> = {
  DropIndicatorComponent: DefaultDropIndicator,
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  autoScrollActivationOffset: 40,
  autoScrollEnabled: true,
  autoScrollSpeed: 1,
  dragEnabled: true,
  inactiveItemOpacity: 0.5,
  inactiveItemScale: 1,
  reorderStrategy: 'insert',
  scrollableRef: undefined,
  showDropIndicator: false
};
