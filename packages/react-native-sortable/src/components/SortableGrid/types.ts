export type SortableGridRenderItemInfo<I> = {
  item: I;
};

export type SortableGridRenderItem<I> = (
  info: SortableGridRenderItemInfo<I>
) => JSX.Element;
