import type { DragEndCallback, DragEndParams } from '../types';
import { reorderOnDragEnd } from '../utils';
import { markAsInternal } from './helpers';

export function useDragEndHandler<I>(
  data: Array<I>,
  callback: (data: Array<I>) => void
): DragEndCallback {
  function useStableCallback(params: DragEndParams) {
    callback(reorderOnDragEnd(data, params));
  }
  return markAsInternal(useStableCallback, 'DragEndCallback');
}
