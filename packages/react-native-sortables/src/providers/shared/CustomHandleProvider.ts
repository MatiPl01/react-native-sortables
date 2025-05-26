import { type ReactNode } from 'react';
import type { View } from 'react-native';
import type { AnimatedRef, MeasuredDimensions } from 'react-native-reanimated';
import { measure, useSharedValue } from 'react-native-reanimated';

import { useUICallback } from '../../hooks';
import type { CustomHandleContextType, Vector } from '../../types';
import { useAnimatedDebounce } from '../../utils';
import { createProvider } from '../utils';
import { useActiveItemValuesContext } from './ActiveItemValuesProvider';
import { useCommonValuesContext } from './CommonValuesProvider';

type CustomHandleProviderProps = {
  children?: ReactNode;
};

const { CustomHandleProvider, useCustomHandleContext } = createProvider(
  'CustomHandle',
  { guarded: false }
)<CustomHandleProviderProps, CustomHandleContextType>(() => {
  const { containerRef } = useCommonValuesContext();
  const { activeItemKey, activeItemPosition } = useActiveItemValuesContext();
  const debounce = useAnimatedDebounce();

  const fixedItemKeys = useSharedValue<Record<string, boolean>>({});
  const activeHandleMeasurements = useSharedValue<MeasuredDimensions | null>(
    null
  );
  const activeHandleOffset = useSharedValue<Vector | null>(null);

  const makeItemFixed = useUICallback((key: string) => {
    'worklet';
    fixedItemKeys.value[key] = true;
    debounce(fixedItemKeys.modify, 100);
  }, []);

  const removeFixedItem = useUICallback((key: string) => {
    'worklet';
    delete fixedItemKeys.value[key];
    debounce(fixedItemKeys.modify, 100);
  }, []);

  const updateActiveHandleMeasurements = useUICallback(
    (key: string, handleRef: AnimatedRef<View>) => {
      if (key !== activeItemKey.value) {
        return;
      }

      const handleMeasurements = measure(handleRef);
      const containerMeasurements = measure(containerRef);
      if (
        !handleMeasurements ||
        !containerMeasurements ||
        !activeItemPosition.value
      ) {
        return;
      }

      activeHandleMeasurements.value = handleMeasurements;
      const { x: activeX, y: activeY } = activeItemPosition.value;
      activeHandleOffset.value = {
        x: handleMeasurements.pageX - containerMeasurements.pageX - activeX,
        y: handleMeasurements.pageY - containerMeasurements.pageY - activeY
      };
    },
    []
  );

  return {
    value: {
      activeHandleMeasurements,
      activeHandleOffset,
      fixedItemKeys,
      makeItemFixed,
      removeFixedItem,
      updateActiveHandleMeasurements
    }
  };
});

export { CustomHandleProvider, useCustomHandleContext };
