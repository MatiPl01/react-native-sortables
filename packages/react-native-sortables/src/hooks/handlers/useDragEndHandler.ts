import { isWorkletFunction } from 'react-native-reanimated';

import type { AnyRecord, DragEndCallback, DragEndParams } from '../../types';
import { useStableCallbackValue } from '../reanimated';

export default function useDragEndHandler<P extends AnyRecord>(
  onDragEnd: ((params: P) => void) | undefined,
  updateParams: (params: DragEndParams) => P
) {
  let callback: DragEndCallback | undefined;

  if (isWorkletFunction(onDragEnd)) {
    callback = (params: DragEndParams) => {
      'worklet';
      onDragEnd(updateParams(params));
    };
  } else if (onDragEnd) {
    callback = (params: DragEndParams) => {
      onDragEnd(updateParams(params));
    };
  }

  return useStableCallbackValue(callback);
}
