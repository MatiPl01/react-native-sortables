import { isWorkletFunction } from 'react-native-reanimated';

import { useStableCallbackValue } from '../../integrations/reanimated/hooks';
import type { AnyRecord, DragEndCallback, DragEndParams } from '../../types';
import { logger } from '../../utils';

export default function useDragEndHandler<P extends AnyRecord>(
  onDragEnd: ((params: P) => void) | undefined,
  jsParamUpdaters: {
    [K in keyof Omit<P, keyof DragEndParams>]: (params: DragEndParams) => P[K];
  }
) {
  let callback: DragEndCallback | undefined;

  if (isWorkletFunction(onDragEnd)) {
    const jsParams = Object.keys(jsParamUpdaters);

    callback = (params: DragEndParams) => {
      'worklet';
      const proxy = new Proxy(params, {
        get: (target, prop) => {
          const key = prop as keyof DragEndParams;
          if (jsParams.includes(key)) {
            logger.warn(
              `Accessing \`${key}\` in \`onDragEnd\` callback is not supported in the worklet. Please use a JS callback instead.`
            );
          }
          return target[key];
        }
      });
      onDragEnd(proxy);
    };
  } else if (onDragEnd) {
    callback = (params: DragEndParams) => {
      const result = params as unknown as P;
      Object.entries(jsParamUpdaters).forEach(entry => {
        const [key, update] = entry as [
          keyof P,
          (params: DragEndParams) => P[keyof P]
        ];
        result[key] = update(params);
      });
      onDragEnd(result);
    };
  }

  return useStableCallbackValue(callback);
}
