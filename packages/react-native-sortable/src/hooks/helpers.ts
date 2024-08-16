import type { OrderChangeCallback } from '../types';
import { reorderItems } from '../utils';

export function useOrderUpdater<I>(
  data: Array<I>,
  callback: (data: Array<I>) => void
): OrderChangeCallback {
  return function useStableCallback(params) {
    const { fromIndex, reorderStrategy, toIndex } = params;
    callback(reorderItems(data, fromIndex, toIndex, reorderStrategy));
  };
}
