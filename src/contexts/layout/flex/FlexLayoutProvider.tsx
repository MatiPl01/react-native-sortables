import type { PropsWithChildren } from 'react';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { useMeasurementsContext, usePositionsContext } from '../../../contexts';
import { createGuardedContext } from '../../utils';
import type { FlexProps } from './types';

type FlexLayoutContextType = Record<never, never>;

type FlexLayoutProviderProps = PropsWithChildren<FlexProps>;

const { FlexLayoutProvider, useFlexLayoutContext } = createGuardedContext(
  'FlexLayout'
)<FlexLayoutContextType, FlexLayoutProviderProps>(({
  // alignContent = 'flex-start',
  // alignItems = 'flex-start',
  // children,
  // columnGap = 0,
  flexDirection = 'row',
  flexWrap = 'nowrap'
  // gap,
  // justifyContent = 'flex-start',
  // rowGap = 0
}) => {
  const { containerWidth, itemDimensions } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  // ITEM GROUPS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value
    }),
    ({ dimensions, idxToKey }) => {},
    [flexDirection, flexWrap]
  );

  return {
    value: {}
  };
});

export { FlexLayoutProvider, useFlexLayoutContext };
