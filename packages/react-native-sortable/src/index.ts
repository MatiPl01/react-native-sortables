/* eslint-disable import/no-unused-modules */

import { SortableFlex, SortableGrid, SortableLayer } from './components';

export type { DropIndicatorComponentProps } from './components';
export { useDragEndHandler } from './hooks';
export type {
  DragEndCallback,
  DragEndParams,
  DragStartCallback,
  DragStartParams,
  OrderChangeCallback,
  OrderChangeParams,
  ReorderStrategy,
  SortableFlexProps,
  SortableGridDragEndCallback,
  SortableGridDragEndParams,
  SortableGridProps,
  SortableGridRenderItem
} from './types';

const Sortable = {
  Flex: SortableFlex,
  Grid: SortableGrid,
  Layer: SortableLayer
};

export default Sortable;
