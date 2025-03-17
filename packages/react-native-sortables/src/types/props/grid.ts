import type { ReactNode } from 'react';

import type {
  CommonValuesContextType,
  DebugProviderContextType,
  GridLayoutContextType,
  OrderUpdater
} from '../providers';
import type { AnimatableProps, Simplify } from '../utils';
import type { DragEndParams, SharedProps } from './shared';

/** Parameters passed to the onDragEnd callback of a sortable grid */
export type SortableGridDragEndParams<I> = {
  /** Data array with items in their new order */
  data: Array<I>;
} & DragEndParams;

/** Callback function called when drag gesture ends in a sortable grid
 * @param params Drag end callback parameters
 */
export type SortableGridDragEndCallback<I> = (
  params: SortableGridDragEndParams<I>
) => void;

export type SortableGridLayoutSettings = (
  | {
      columns?: number;
      rows?: never;
      rowHeight?: number;
    }
  | {
      rows: number;
      rowHeight: number;
      columns?: number;
    }
) &
  Partial<
    AnimatableProps<{
      /** Vertical spacing between grid items */
      rowGap: number;
      /** Horizontal spacing between grid items */
      columnGap: number;
    }>
  >;

/** Information passed to the renderItem function */
export type SortableGridRenderItemInfo<I> = {
  /** The item to render */
  item: I;
  /** Index of the item in the data array */
  index: number;
};

/** Function to render an individual item in the grid
 * @param info Object containing the item and its index
 * @returns React node to render
 */
export type SortableGridRenderItem<I> = (
  info: SortableGridRenderItemInfo<I>
) => ReactNode;

/** Factory function for creating custom reordering strategies
 * @param props Context values and layout information
 * @returns Function to update item order
 */
export type SortableGridStrategyFactory = (
  props: Simplify<
    { debugContext?: DebugProviderContextType } & CommonValuesContextType &
      GridLayoutContextType
  >
) => OrderUpdater;

/** Strategy to use for reordering items:
 * - 'insert': Shifts all items between the dragged item and the target
 * position to make space for the dragged item
 * - 'swap': Swaps the dragged item with the item at the target position
 * - Or a custom strategy factory function
 */
export type SortableGridStrategy =
  | 'insert'
  | 'swap'
  | SortableGridStrategyFactory;

/** Props for the SortableGrid component */
export type SortableGridProps<I> = Simplify<
  {
    /** Array of items to render in the grid */
    data: Array<I>;
    /** Function to render each item */
    renderItem: SortableGridRenderItem<I>;
    /** Strategy to use for reordering items */
    strategy?: SortableGridStrategy;
    /** Callback fired when drag gesture ends.
     * @note This callback is always called when drag ends, even if the order hasn't changed.
     * When order remains the same, the data array in the callback parameters will maintain
     * referential equality with the original data prop, making it safe to use directly
     * with setState without triggering unnecessary re-renders.
     */
    onDragEnd?: SortableGridDragEndCallback<I>;
    /** Function to extract a unique key for each item
     * @param item The item to get key from
     * @returns Unique string key
     * @default Returns:
     * - If item is an object with id or key property, returns that property value
     * - Otherwise returns stringified item (inefficient for large objects, custom implementation recommended)
     * @important If your data items are objects that have neither id nor key properties,
     * it is strongly recommended to provide a custom keyExtractor implementation.
     */
    keyExtractor?: (item: I) => string;

    /** Function to extract a sortable property for each item
     * @param item The item to get sortable property from
     * @returns Boolean value indicating whether the item is sortable
     * @default Returns:
     * - If item is an object with sortable property, returns that property value
     * - Otherwise returns true
     */
    sortableExtractor?: (item: I) => boolean;

    /** Number of columns in the grid.
     *
     * Used to create a vertical grid layout where items flow from top to bottom,
     * then left to right.
     * @default 1
     */
    columns?: number;

    /** Number of rows in the grid.
     *
     * Used to create a horizontal grid layout where items flow from left to right,
     * then top to bottom.
     * @important Setting this property switches the grid to horizontal layout.
     * Requires rowHeight to be set.
     */
    rows?: number;

    /** Fixed height for each row in pixels in the horizontal grid.
     *
     * All rows of the horizontal grid have the same height.
     * @important Works only for horizontal grids. Requires the rows property to be set.
     */
    rowHeight?: number;
  } & Omit<SharedProps, 'onDragEnd'> &
    SortableGridLayoutSettings
>;
