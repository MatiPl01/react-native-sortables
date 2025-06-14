import { type ReactNode, useCallback } from 'react';
import type { View } from 'react-native';
import type { AnimatedRef, MeasuredDimensions } from 'react-native-reanimated';
import { measure, runOnUI, useSharedValue } from 'react-native-reanimated';

import type { CustomHandleContextType, Vector } from '../../types';
import { useAnimatedDebounce } from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

type CustomHandleProviderProps = {
  children?: ReactNode;
};

const { CustomHandleProvider, useCustomHandleContext } = createProvider(
  'CustomHandle',
  { guarded: false }
)<CustomHandleProviderProps, CustomHandleContextType>(() => {
  const { containerRef, itemPositions } = useCommonValuesContext();
  const debounce = useAnimatedDebounce();

  const fixedItemKeys = useSharedValue<Record<string, boolean>>({});
  const handleRefs = useSharedValue<Record<string, AnimatedRef<View>>>({});
  const activeHandleMeasurements = useSharedValue<MeasuredDimensions | null>(
    null
  );
  const activeHandleOffset = useSharedValue<null | Vector>(null);

  const registerHandle = useCallback(
    (key: string, handleRef: AnimatedRef<View>, fixed: boolean) => {
      runOnUI(() => {
        'worklet';
        handleRefs.value[key] = handleRef;
        if (fixed) {
          fixedItemKeys.value[key] = true;
          debounce(fixedItemKeys.modify, 100);
        }
      })();

      const unregister = () => {
        'worklet';
        delete handleRefs.value[key];
        if (fixed) {
          fixedItemKeys.value[key] = false;
          debounce(fixedItemKeys.modify, 100);
        }
      };

      return runOnUI(unregister);
    },
    [debounce, fixedItemKeys, handleRefs]
  );

  const updateActiveHandleMeasurements = useCallback(
    (key: string) => {
      'worklet';
      const handleRef = handleRefs.value[key];
      if (!handleRef) {
        return;
      }

      const handleMeasurements = measure(handleRef);
      const containerMeasurements = measure(containerRef);
      const itemPosition = itemPositions.value[key];

      if (!handleMeasurements || !containerMeasurements || !itemPosition) {
        return;
      }

      activeHandleMeasurements.value = handleMeasurements;
      const { x: itemX, y: itemY } = itemPosition;
      activeHandleOffset.value = {
        x: handleMeasurements.pageX - containerMeasurements.pageX - itemX,
        y: handleMeasurements.pageY - containerMeasurements.pageY - itemY
      };
    },
    [
      activeHandleMeasurements,
      activeHandleOffset,
      containerRef,
      handleRefs,
      itemPositions
    ]
  );

  return {
    value: {
      activeHandleMeasurements,
      activeHandleOffset,
      fixedItemKeys,
      registerHandle,
      updateActiveHandleMeasurements
    }
  };
});

export { CustomHandleProvider, useCustomHandleContext };
