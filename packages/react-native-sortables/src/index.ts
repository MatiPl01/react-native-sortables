/* eslint-disable import/no-unused-modules */
import { Pressable, TouchableHighlight, TouchableOpacity } from 'react-native';

import {
  createSortableTouchable,
  SortableFlex,
  SortableGrid,
  SortableHandle,
  SortableLayer
} from './components';

export type { SortableHandleProps, SortableLayerProps } from './components';
export * from './constants/layoutAnimations';
export type {
  DragEndCallback,
  DragEndParams,
  DragStartCallback,
  DragStartParams,
  DropIndicatorComponentProps,
  OrderChangeCallback,
  OrderChangeParams,
  OverDrag,
  ReorderTriggerOrigin,
  SortableFlexProps,
  SortableFlexStrategyFactory,
  SortableFlexStyle,
  SortableGridDragEndCallback,
  SortableGridDragEndParams,
  SortableGridProps,
  SortableGridRenderItem,
  SortableGridStrategyFactory
} from './types';

const Sortable = {
  Flex: SortableFlex,
  Grid: SortableGrid,
  Handle: SortableHandle,
  Layer: SortableLayer,
  Pressable: createSortableTouchable(Pressable),
  TouchableHighlight: createSortableTouchable(TouchableHighlight),
  TouchableOpacity: createSortableTouchable(TouchableOpacity)
};

export default Sortable;
