/* eslint-disable import/no-unused-modules */
import { Pressable, TouchableHighlight, TouchableOpacity } from 'react-native';

import { SortableFlex, SortableGrid, SortableLayer } from './components';
import { createSortableTouchable } from './utils';

export type { DropIndicatorComponentProps } from './components';
export * from './constants/layoutAnimations';
export type {
  DragEndCallback,
  DragEndParams,
  DragStartCallback,
  DragStartParams,
  OrderChangeCallback,
  OrderChangeParams,
  SortableFlexProps,
  SortableFlexStrategyFactory,
  SortableGridDragEndCallback,
  SortableGridDragEndParams,
  SortableGridProps,
  SortableGridRenderItem,
  SortableGridStrategyFactory
} from './types';

const Sortable = {
  Flex: SortableFlex,
  Grid: SortableGrid,
  Layer: SortableLayer,
  Pressable: createSortableTouchable(Pressable),
  TouchableHighlight: createSortableTouchable(TouchableHighlight),
  TouchableOpacity: createSortableTouchable(TouchableOpacity)
};

export default Sortable;
