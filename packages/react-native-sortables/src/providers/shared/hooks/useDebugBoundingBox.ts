/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useMemo } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { Vector } from '../../../types';
import { isValidVector } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';

type DebugRectColors = {
  backgroundColor: string;
  borderColor: string;
};

const DEBUG_COLORS: DebugRectColors = {
  backgroundColor: '#1111ef',
  borderColor: '#00007e'
};

const DEBUG_RECT_KEYS = ['bottom', 'left', 'right', 'top'] as const;

type DebugBox = Record<
  (typeof DEBUG_RECT_KEYS)[number],
  {
    hide: () => void;
    update: (from: Vector, to: Vector, colors?: DebugRectColors) => void;
  }
> & {
  hide: () => void;
};

export default function useDebugBoundingBox(
  isAbsolute = false
): DebugBox | undefined {
  if (!__DEV__) {
    return undefined;
  }

  const { activeItemKey } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects(
    DEBUG_RECT_KEYS as unknown as Array<string>
  );

  const updateDebugRect = useCallback(
    (key: string, from: Vector, to: Vector, colors?: DebugRectColors) => {
      'worklet';
      if (!isValidVector(from) || !isValidVector(to)) {
        debugRects?.[key]?.hide();
      } else {
        debugRects?.[key]?.set({
          ...(colors ?? DEBUG_COLORS),
          from,
          isAbsolute,
          to
        });
      }
    },
    [debugRects, isAbsolute]
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
              update: (from: Vector, to: Vector, colors?: DebugRectColors) => {
                'worklet';
                updateDebugRect(key, from, to, colors);
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
