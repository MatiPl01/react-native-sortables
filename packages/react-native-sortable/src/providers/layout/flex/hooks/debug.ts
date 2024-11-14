import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../../debug';
import type { Coordinate } from '../../../../types';
import { useCommonValuesContext } from '../../../shared';

const DEBUG_COLORS = {
  backgroundColor: '#1111ef',
  borderColor: '#00007e'
};

export function useSwapDebugRectsUpdater() {
  'worklet';
  const { activeItemKey } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects([
    'crossBefore',
    'crossAfter',
    'mainBefore',
    'mainAfter'
  ]);

  useAnimatedReaction(
    () => activeItemKey.value,
    () => {
      if (debugRects && activeItemKey.value === null) {
        Object.values(debugRects).forEach(rect => rect.hide());
      }
    }
  );

  const updater = useCallback(
    (
      coordinates: { main: Coordinate; cross: Coordinate },
      gaps: { main: SharedValue<number>; cross: SharedValue<number> },
      main: {
        bounds: { before: number | undefined; after: number | undefined };
        offsets: { before: number; after: number };
      },
      cross: {
        bounds: { before: number; after: number };
        offsets: { before: number; after: number };
      }
    ) => {
      'worklet';
      if (!debugRects) {
        return;
      }

      // For row direction
      if (coordinates.main === 'x' && coordinates.cross === 'y') {
        debugRects.crossBefore.set({
          ...DEBUG_COLORS,
          from: { x: main.offsets.before, y: cross.bounds.before },
          to: { x: main.offsets.after, y: cross.offsets.before }
        });
        debugRects.crossAfter.set({
          ...DEBUG_COLORS,
          from: {
            x: main.offsets.before,
            y: cross.offsets.after - gaps.cross.value
          },
          to: { x: main.offsets.after, y: cross.bounds.after }
        });

        if (main.bounds.before !== undefined) {
          debugRects.mainBefore.set({
            ...DEBUG_COLORS,
            from: { x: main.bounds.before, y: cross.bounds.before },
            to: {
              x: Math.max(main.offsets.before, main.bounds.before),
              y: cross.bounds.after
            }
          });
        } else {
          debugRects.mainBefore.hide();
        }

        if (main.bounds.after !== undefined) {
          debugRects.mainAfter.set({
            ...DEBUG_COLORS,
            from: {
              x: Math.min(main.offsets.after, main.bounds.after),
              y: cross.bounds.before
            },
            to: { x: main.bounds.after, y: cross.bounds.after }
          });
        } else {
          debugRects.mainAfter.hide();
        }
      }
      // For column direction
      else if (coordinates.main === 'y' && coordinates.cross === 'x') {
        debugRects.crossBefore.set({
          ...DEBUG_COLORS,
          from: { x: cross.bounds.before, y: main.offsets.before },
          to: { x: cross.offsets.before, y: main.offsets.after }
        });
        debugRects.crossAfter.set({
          ...DEBUG_COLORS,
          from: {
            x: cross.offsets.after - gaps.cross.value,
            y: main.offsets.before
          },
          to: { x: cross.bounds.after, y: main.offsets.after }
        });

        if (main.bounds.before !== undefined) {
          debugRects.mainBefore.set({
            ...DEBUG_COLORS,
            from: { x: cross.bounds.before, y: main.bounds.before },
            to: {
              x: cross.bounds.after,
              y: Math.max(main.offsets.before, main.bounds.before)
            }
          });
        } else {
          debugRects.mainBefore.hide();
        }

        if (main.bounds.after !== undefined) {
          debugRects.mainAfter.set({
            ...DEBUG_COLORS,
            from: {
              x: cross.bounds.before,
              y: Math.min(main.offsets.after, main.bounds.after)
            },
            to: { x: cross.bounds.after, y: main.bounds.after }
          });
        } else {
          debugRects.mainAfter.hide();
        }
      }
    },
    [debugRects]
  );

  return debugRects ? updater : null;
}
