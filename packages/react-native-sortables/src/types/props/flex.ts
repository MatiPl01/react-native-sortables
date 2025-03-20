import type { PropsWithChildren } from 'react';

import type {
  AlignContent,
  AlignItems,
  FlexDirection,
  FlexWrap,
  JustifyContent
} from '../layout/flex';
import type {
  CommonValuesContextType,
  CustomHandleContextType,
  DebugContextType,
  FlexLayoutContextType,
  OrderUpdater
} from '../providers';
import type { Simplify } from '../utils';
import type { DragEndParams, SharedProps } from './shared';

/** Parameters passed to the onDragEnd callback of a sortable flex container */
export type SortableFlexDragEndParams = {
  /** Function that takes an array of items and returns a new array with updated order.
   * @note If the order hasn't changed, returns the original array reference,
   * making it safe to use with setState without triggering unnecessary re-renders.
   */
  order: <I>(data: Array<I>) => Array<I>;
} & DragEndParams;

/** Callback function called when drag gesture ends in a sortable flex container.
 * @note This callback is always called when drag ends, even if the order hasn't changed.
 * The order function provided in the callback parameters will maintain referential
 * equality with the original data when order hasn't changed, making it safe to use
 * directly with setState without triggering unnecessary re-renders.
 * @param params Parameters containing the order function and drag event data
 */
export type SortableFlexDragEndCallback = (
  params: SortableFlexDragEndParams
) => void;

/** Factory function for creating custom reordering strategies
 * @param props Context values and layout information
 * @returns Function to update item order
 */
export type SortableFlexStrategyFactory = (
  props: Simplify<
    { debugContext?: DebugContextType } & CommonValuesContextType &
      FlexLayoutContextType &
      Partial<CustomHandleContextType>
  >
) => OrderUpdater;

/** Strategy to use for reordering items:
 * - 'insert': Shifts all items between the dragged item and the target
 * position to make space for the dragged item
 * - Or a custom strategy factory function
 */
export type SortableFlexStrategy = 'insert' | SortableFlexStrategyFactory;

/** Style properties for the flex container */
export type SortableFlexStyle = {
  /** Defines how multiple lines of items are aligned within the container along the cross axis */
  alignContent?: AlignContent;
  /** Defines how items are aligned along the main axis */
  justifyContent?: JustifyContent;
  /** Defines how items are aligned along the cross axis */
  alignItems?: AlignItems;
  /** Defines the direction of the main axis (row or column) */
  flexDirection?: FlexDirection;
  /** Controls whether items should wrap to new lines */
  flexWrap?: FlexWrap;
  /** Spacing between both rows and columns */
  gap?: number;
  /** Spacing between rows */
  rowGap?: number;
  /** Spacing between columns */
  columnGap?: number;
  /** Container height ('fill' to take all available space) */
  height?: 'fill' | number;
  /** Container width ('fill' to take all available space) */
  width?: 'fill' | number;
  /** Minimum height of the container */
  minHeight?: number;
  /** Minimum width of the container */
  minWidth?: number;
  /** Maximum height of the container */
  maxHeight?: number;
  /** Maximum width of the container */
  maxWidth?: number;
  /** Padding on all sides */
  padding?: number;
  /** Padding at the top */
  paddingTop?: number;
  /** Padding on the right */
  paddingRight?: number;
  /** Padding on the left */
  paddingLeft?: number;
  /** Padding at the bottom */
  paddingBottom?: number;
  /** Padding on top and bottom */
  paddingVertical?: number;
  /** Padding on left and right */
  paddingHorizontal?: number;
};

/** Props for the SortableFlex component */
export type SortableFlexProps = Simplify<
  PropsWithChildren<
    {
      /** Strategy to use for reordering items.
       * @default 'insert'
       */
      strategy?: SortableFlexStrategy;
      /** Callback fired when drag gesture ends.
       * @note This callback is always called when drag ends, even if the order hasn't changed.
       * The order function provided in the callback parameters will maintain referential
       * equality with the original data when order hasn't changed.
       */
      onDragEnd?: SortableFlexDragEndCallback;
    } & Omit<SharedProps, 'onDragEnd'> &
      SortableFlexStyle
  >
>;
