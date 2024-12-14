import type { DragEndCallback, DragEndParams } from '../types';
import { markAsInternal, reorderOnDragEnd } from '../utils';

export function useDragEndHandler<I>(
  data: Array<I>,
  callback: (data: Array<I>) => void
): DragEndCallback<I> {
  function useStableCallback(params: DragEndParams<I>) {
    callback(reorderOnDragEnd(data, params, true));
  }
  return markAsInternal(useStableCallback, 'DragEndCallback');
}
