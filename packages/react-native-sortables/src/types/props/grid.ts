import type {
  CommonValuesContextType,
  DebugProviderContextType,
  GridLayoutContextType,
  OrderUpdater
} from '../providers';
import type { AnimatableProps, Simplify } from '../utils';
import type { DragEndParams, SharedProps } from './shared';

export type SortableGridDragEndParams<I> = {
  data: Array<I>;
} & DragEndParams;

export type SortableGridDragEndCallback<I> = (
  params: SortableGridDragEndParams<I>
) => void;

export type SortableGridLayoutSettings = (
  | {
      columns: number;
      rows?: never;
    }
  | {
      rows: number;
      columns?: number;
    }
) &
  AnimatableProps<{
    rowGap: number;
    columnGap: number;
  }>;

export type SortableGridRenderItemInfo<I> = {
  item: I;
  index: number;
};

export type SortableGridRenderItem<I> = (
  info: SortableGridRenderItemInfo<I>
) => JSX.Element;

export type SortableGridStrategyFactory = (
  props: Simplify<
    { debugContext?: DebugProviderContextType } & CommonValuesContextType &
      GridLayoutContextType
  >
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
