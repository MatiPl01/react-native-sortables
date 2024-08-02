import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { Vector } from '../../../types';
import { areArraysDifferent } from '../../../utils';
import { createEnhancedContext } from '../../utils';

type PositionsContextType = {
  keyToIndex: SharedValue<Record<string, number>>;
  indexToKey: SharedValue<Array<string>>;
  itemPositions: SharedValue<Record<string, Vector>>;
  touchStartPosition: SharedValue<Vector | null>;
  relativeTouchPosition: SharedValue<Vector | null>;
  touchedItemPosition: SharedValue<Vector | null>;
};

type PositionsProviderProps = PropsWithChildren<{
  itemKeys: Array<string>;
}>;

const { PositionsProvider, usePositionsContext } = createEnhancedContext(
  'Positions'
)<PositionsContextType, PositionsProviderProps>(({ itemKeys }) => {
  const prevKeysRef = useRef<Array<string>>([]);

  const indexToKey = useSharedValue<Array<string>>(itemKeys);
  const keyToIndex = useDerivedValue(() =>
    Object.fromEntries(indexToKey.value.map((key, index) => [key, index]))
  );

  const itemPositions = useSharedValue<Record<string, Vector>>({});
  const touchStartPosition = useSharedValue<Vector | null>(null);
  const relativeTouchPosition = useSharedValue<Vector | null>(null);
  const touchedItemPosition = useSharedValue<Vector | null>(null);

  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys;
      prevKeysRef.current = itemKeys;
    }
  }, [itemKeys, indexToKey]);

  return {
    value: {
      indexToKey,
      itemPositions,
      keyToIndex,
      relativeTouchPosition,
      touchStartPosition,
      touchedItemPosition
    }
  };
});

export { PositionsProvider, usePositionsContext };
