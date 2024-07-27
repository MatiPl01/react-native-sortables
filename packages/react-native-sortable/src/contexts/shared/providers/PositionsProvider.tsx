import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import type { ComplexSharedValues } from 'reanimated-utils';
import { useComplexSharedValues } from 'reanimated-utils';

import type { AnimatedOptionalPosition, Position } from '../../../types';
import {
  areArraysDifferent,
  arePositionsDifferent,
  updateIfDifferent
} from '../../../utils';
import { createEnhancedContext } from '../../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useDragContext } from './DragProvider';

type PositionsContextType = {
  keyToIndex: ComplexSharedValues<Record<string, SharedValue<number>>>;
  indexToKey: SharedValue<Array<string>>;
  targetItemPositions: ComplexSharedValues<
    Record<string, AnimatedOptionalPosition>
  >;
  currentItemPositions: ComplexSharedValues<
    Record<string, AnimatedOptionalPosition>
  >;
  setActiveItemPosition: (x: number, y: number) => void;
};

type PositionsProviderProps = PropsWithChildren<{
  itemKeys: Array<string>;
}>;

const { PositionsProvider, usePositionsContext } = createEnhancedContext(
  'Positions'
)<PositionsContextType, PositionsProviderProps>(({ itemKeys }) => {
  const { activeItemKey, activeItemPosition } = useDragContext();
  const { currentScrollOffset, dragStartScrollOffset } =
    useAutoScrollContext() ?? {};

  const prevKeysRef = useRef<Array<string>>([]);
  const activeItemPositionWithoutScroll = useSharedValue<Position | null>(null);

  const indexToKey = useSharedValue(itemKeys);
  const keyToIndex = useComplexSharedValues(
    s => s.record(s.mutable(0)),
    itemKeys
  );
  // Positions determined by the calculated layout
  const targetItemPositions = useComplexSharedValues<
    Record<string, AnimatedOptionalPosition>
  >(s => s.record({ x: s.mutable(null), y: s.mutable(null) }), itemKeys);
  // Real item positions on the screens, which are updated during item animations
  const currentItemPositions = useComplexSharedValues<
    Record<string, AnimatedOptionalPosition>
  >(s => s.record({ x: s.mutable(null), y: s.mutable(null) }), itemKeys);

  useAnimatedReaction(
    () => indexToKey.value,
    idxToKey => {
      for (let i = 0; i < idxToKey.length; i++) {
        keyToIndex.set(idxToKey[i]!, i);
      }
    }
  );

  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys;
      prevKeysRef.current = itemKeys;
    }
  }, [itemKeys, indexToKey]);

  // Update the active item position based on the position set by the helper
  // function and the scroll offset
  useAnimatedReaction(
    () => ({
      key: activeItemKey.value,
      offset:
        (currentScrollOffset?.value ?? 0) - (dragStartScrollOffset?.value ?? 0),
      positionWithoutScroll: activeItemPositionWithoutScroll.value
    }),
    ({ key, offset, positionWithoutScroll }) => {
      if (key === null || positionWithoutScroll === null) {
        activeItemPositionWithoutScroll.value = null;
        activeItemPosition.value = null;
        return;
      }
      const currentPosition = {
        x: positionWithoutScroll.x,
        y: positionWithoutScroll.y + offset
      };
      // Update activeItemPosition in the drag context
      updateIfDifferent(
        activeItemPosition,
        currentPosition,
        arePositionsDifferent
      );
      // Update the current position of the active item
      // (for efficiency, update it directly instead of reacting to activeItemPosition
      // changes and checking whether the item is active)
      currentItemPositions.set(key, currentPosition);
    }
  );

  const setActiveItemPosition = useCallback(
    (x: number, y: number) => {
      'worklet';
      if (activeItemKey.value !== null) {
        activeItemPositionWithoutScroll.value = { x, y };
      }
    },
    [activeItemKey, activeItemPositionWithoutScroll]
  );

  return {
    value: {
      currentItemPositions,
      indexToKey,
      keyToIndex,
      setActiveItemPosition,
      targetItemPositions
    }
  };
});

export { PositionsProvider, usePositionsContext };
