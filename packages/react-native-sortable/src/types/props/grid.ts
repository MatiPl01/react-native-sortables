import type { GridLayoutContextType } from '../../providers';
import type { Dimensions, Vector } from '../layout';
import type {
  CommonValuesContextType,
  DebugProviderContextType,
  OrderUpdater
} from '../providers';
import type { AnimatableValues, Simplify } from '../utils';
import type { DragEndParams, SharedProps } from './shared';

export type GridLayoutProps = {
  columnWidth: number;
  gaps: {
    row: number;
    column: number;
  };
  itemDimensions: Record<string, Dimensions>;
  indexToKey: Array<string>;
  numColumns: number;
};

export type GridLayout = {
  rowOffsets: Array<number>;
  itemPositions: Record<string, Vector>;
  containerHeight: number;
};

export type SortableGridDragEndParams<I> = {
  data: Array<I>;
} & DragEndParams;

export type SortableGridDragEndCallback<I> = (
  params: SortableGridDragEndParams<I>
) => void;

export type SortableGridLayoutSettings = {
  columns: number;
} & AnimatableValues<{
  rowGap: number;
  columnGap: number;
}>;

export type SortableGridRenderItemInfo<I> = {
  item: I;
};

export type SortableGridRenderItem<I> = (
  info: SortableGridRenderItemInfo<I>
) => JSX.Element;

export type SortableGridStrategyFactory = (
  props: { debugContext?: DebugProviderContextType } & CommonValuesContextType &
    GridLayoutContextType
) => OrderUpdater;

export type SortableGridStrategy =
  | 'insert'
  | 'swap'
  | SortableGridStrategyFactory;

export type SortableGridProps<I> = Simplify<
  {
    data: Array<I>;
    renderItem: SortableGridRenderItem<I>;
    strategy?: SortableGridStrategy;
    onDragEnd?: SortableGridDragEndCallback<I>;
    keyExtractor?: (item: I, index: number) => string;
  } & Omit<SharedProps, 'onDragEnd'> &
    Partial<SortableGridLayoutSettings>
>;
