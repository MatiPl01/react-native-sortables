import type { DragEndCallback, DragEndParams } from '../types';
import { markAsInternal, reorderOnDragEnd } from '../utils';

export function useDragEndHandler<I>(
  data: Array<I>,
  callback: (data: Array<I>) => void
): DragEndCallback {
  function useStableCallback(params: DragEndParams) {
    callback(reorderOnDragEnd(data, params, true));
  }
  return markAsInternal(useStableCallback, 'DragEndCallback');
}
