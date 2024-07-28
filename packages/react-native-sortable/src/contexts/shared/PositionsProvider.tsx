import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { Vector } from '../../types';
import { areArraysDifferent } from '../../utils';
import { createEnhancedContext } from '../utils';

type PositionsContextType = {
  keyToIndex: SharedValue<Record<string, number>>;
  indexToKey: SharedValue<Array<string>>;
  itemPositions: SharedValue<Record<string, Vector>>;
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
      keyToIndex
    }
  };
});

export { PositionsProvider, usePositionsContext };
