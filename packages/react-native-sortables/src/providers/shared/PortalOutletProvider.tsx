import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import { runOnUI } from 'react-native-reanimated';

import { createProvider } from '../utils';

type PortalOutletProviderProps = PropsWithChildren<{
  portalOutletRef: AnimatedRef<View>;
  measurePortalOutlet: () => void;
}>;

const { PortalOutletProvider, usePortalOutletContext } = createProvider(
  'PortalOutlet',
  { guarded: false }
)<PortalOutletProviderProps, true>(
  ({ children, measurePortalOutlet, portalOutletRef }) => ({
    children: (
      <View
        collapsable={false}
        ref={portalOutletRef}
        style={styles.container}
        onLayout={runOnUI(measurePortalOutlet)}>
        {children}
      </View>
    ),
    value: true
  })
);

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    top: 0
  }
});

function useIsInPortalOutlet() {
  return !!usePortalOutletContext();
}

export { PortalOutletProvider, useIsInPortalOutlet };
