/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { Vector } from '../../../types';
import { isValidVector } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';

const DEBUG_COLORS = {
  backgroundColor: '#1111ef',
  borderColor: '#00007e'
};

const DEBUG_RECT_KEYS = ['bottom', 'left', 'right', 'top'];

export default function useLayoutDebugRects() {
  if (!__DEV__) {
    return undefined;
  }

  const { activeItemKey } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects(DEBUG_RECT_KEYS);

  const updateDebugRect = useCallback(
    (key: string, from: Vector, to: Vector) => {
      'worklet';
      if (!isValidVector(from) || !isValidVector(to)) {
        debugRects?.[key]?.hide();
      } else {
        debugRects?.[key]?.set({
          ...DEBUG_COLORS,
          from,
          to
        });
      }
    },
    [debugRects]
  );

  useAnimatedReaction(
    () => activeItemKey.value,
    () => {
      if (debugRects && activeItemKey.value === null) {
        Object.values(debugRects).forEach(rect => rect.hide());
      }
    }
  );

  return debugRects ? { updateDebugRect } : undefined;
}
