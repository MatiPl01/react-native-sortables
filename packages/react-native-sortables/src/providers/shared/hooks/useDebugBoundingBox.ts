/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useMemo } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { Vector } from '../../../types';
import { isValidVector } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';

const DEBUG_COLORS = {
  backgroundColor: '#1111ef',
  borderColor: '#00007e'
};

const DEBUG_RECT_KEYS = ['bottom', 'left', 'right', 'top'] as const;

type DebugBox = {
  hide: () => void;
} & Record<
  (typeof DEBUG_RECT_KEYS)[number],
  {
    hide: () => void;
    update: (from: Vector, to: Vector) => void;
  }
>;

export default function useDebugBoundingBox(): DebugBox | undefined {
  if (!__DEV__) {
    return undefined;
  }

  const { activeItemKey } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects(
    DEBUG_RECT_KEYS as unknown as Array<string>
  );

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

  const debugBox = useMemo(
    () =>
      ({
        ...Object.fromEntries(
          DEBUG_RECT_KEYS.map(key => [
            key,
            {
              hide: () => {
                'worklet';
                debugRects?.[key]?.hide();
              },
              update: (from: Vector, to: Vector) => {
                'worklet';
                updateDebugRect(key, from, to);
              }
            }
          ])
        ),
        hide: () => {
          'worklet';
          DEBUG_RECT_KEYS.forEach(key => debugRects?.[key]?.hide());
        }
      }) as DebugBox,
    [updateDebugRect, debugRects]
  );

  useAnimatedReaction(
    () => activeItemKey.value,
    () => {
      if (debugRects && activeItemKey.value === null) {
        Object.values(debugRects).forEach(rect => rect.hide());
      }
    }
  );

  return debugRects && debugBox;
}
