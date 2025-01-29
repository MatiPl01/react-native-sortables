import type { AnyRecord, DragEndCallback, DragEndParams } from '../../types';
import { isInternalFunction } from '../../utils';
import { useStableCallback } from '../callbacks';

export default function useDragEndHandler<P extends AnyRecord>(
  onDragEnd: ((params: P) => void) | undefined,
  updateParams: (params: DragEndParams) => P
) {
  return useStableCallback<DragEndCallback>(params => {
    if (!onDragEnd) {
      return;
    }
    const updatedParams = updateParams(params);
    // For cases when user provides onOrderChange created via a helper
    // useOrderChangeHandler hook
    if (isInternalFunction(onDragEnd, 'DragEndCallback')) {
      return onDragEnd(updatedParams);
    }
    // Add the data property for the sortable grid if a custom user callback is provided
    onDragEnd(updatedParams);
  });
}
