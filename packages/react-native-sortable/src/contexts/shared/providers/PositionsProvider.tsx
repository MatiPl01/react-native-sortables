import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import type { ComplexSharedValues } from 'reanimated-utils';
import { useComplexSharedValues } from 'reanimated-utils';

import type { AnimatedOptionalPosition } from '../../../types';
import { areArraysDifferent } from '../../../utils';
import { createEnhancedContext } from '../../utils';

type PositionsContextType = {
  keyToIndex: ComplexSharedValues<Record<string, SharedValue<number>>>;
  indexToKey: SharedValue<Array<string>>;
  targetItemPositions: ComplexSharedValues<
    Record<string, AnimatedOptionalPosition>
  >;
  currentItemPositions: ComplexSharedValues<
    Record<string, AnimatedOptionalPosition>
  >;
};

type PositionsProviderProps = PropsWithChildren<{
  itemKeys: Array<string>;
}>;

const { PositionsProvider, usePositionsContext } = createEnhancedContext(
  'Positions'
)<PositionsContextType, PositionsProviderProps>(({ itemKeys }) => {
  const prevKeysRef = useRef<Array<string>>([]);

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
        keyToIndex.current[idxToKey[i]!]!.value = i;
      }
    }
  );

  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys;
      prevKeysRef.current = itemKeys;
    }
  }, [itemKeys, indexToKey]);

  return {
    value: {
      currentItemPositions,
      indexToKey,
      keyToIndex,
      targetItemPositions
    }
  };
});

export { PositionsProvider, usePositionsContext };
