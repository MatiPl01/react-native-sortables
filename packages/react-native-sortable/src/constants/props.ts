import { DefaultDropIndicator } from '../components/defaults';
import type { RequiredExcept, SharedProps, SortableCallbacks } from '../types';

type OptionalProps = 'scrollableRef' | keyof SortableCallbacks;

export const SHARED_PROPS: RequiredExcept<SharedProps, OptionalProps> = {
  DropIndicatorComponent: DefaultDropIndicator,
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  autoScrollActivationOffset: 40,
  autoScrollEnabled: true,
  autoScrollSpeed: 1,
  dragEnabled: true,
  hapticsEnabled: false,
  inactiveItemOpacity: 0.5,
  inactiveItemScale: 1,
  onDragEnd: undefined,
  onDragStart: undefined,
  onOrderChange: undefined,
  reorderStrategy: 'insert',
  scrollableRef: undefined,
  showDropIndicator: false
};
