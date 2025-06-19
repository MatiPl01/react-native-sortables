import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { MeasuredDimensions } from 'react-native-reanimated';
import {
  measure,
  useAnimatedRef,
  useSharedValue
} from 'react-native-reanimated';

import { useUIStableCallback } from '../../hooks';
import type { PortalOutletContextType } from '../../types';
import { createProvider } from '../utils';

const { PortalOutletProvider, usePortalOutletContext } = createProvider(
  'PortalOutlet',
  { guarded: false }
)<{ children: ReactNode }, PortalOutletContextType>(({ children }) => {
  const portalOutletRef = useAnimatedRef<View>();
  const portalOutletMeasurements = useSharedValue<MeasuredDimensions | null>(
    null
  );

  const measureOutlet = useUIStableCallback(() => {
    'worklet';
    portalOutletMeasurements.value = measure(portalOutletRef);
  });

  return {
    children: (
      <View
        collapsable={false}
        ref={portalOutletRef}
        style={styles.container}
        onLayout={measureOutlet}>
        {children}
      </View>
    ),
    value: {
      portalOutletMeasurements
    }
  };
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none'
  }
});

export { PortalOutletProvider as PortalOutlet, usePortalOutletContext };
