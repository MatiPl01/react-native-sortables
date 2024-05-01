import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { Position } from '../../types';
import { areArraysDifferent } from '../../utils';
import { createGuardedContext } from '../utils';

type PositionsContextType = {
  keyToIndex: SharedValue<Record<string, number>>;
  indexToKey: SharedValue<Array<string>>;
  itemPositions: SharedValue<Record<string, Position>>;
};

type PositionsProviderProps = PropsWithChildren<{
  itemKeys: Array<string>;
}>;

const { PositionsProvider, usePositionsContext } = createGuardedContext(
  'Positions'
)<PositionsContextType, PositionsProviderProps>(({ itemKeys }) => {
  const prevKeysRef = useRef<Array<string>>([]);

  const indexToKey = useSharedValue<Array<string>>(itemKeys);
  const keyToIndex = useDerivedValue(() =>
    Object.fromEntries(indexToKey.value.map((key, index) => [key, index]))
  );

  const itemPositions = useSharedValue<Record<string, Position>>({});

  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys;
      prevKeysRef.current = itemKeys;
    }
  }, [itemKeys, indexToKey]);

  return {
    indexToKey,
    itemPositions,
    keyToIndex
  };
});

export { PositionsProvider, usePositionsContext };
