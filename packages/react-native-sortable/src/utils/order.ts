import type { DragEndParams } from '../types';
import { reorderItems } from './layout';

export const reorderOnDragEnd = <I>(
  data: Array<I>,
  params: DragEndParams,
  persistIfUnchanged?: boolean
): Array<I> => {
  const { fromIndex, reorderStrategy, toIndex } = params;

  if (persistIfUnchanged && fromIndex === toIndex) {
    return data;
  }

  return reorderItems(data, fromIndex, toIndex, reorderStrategy);
};
