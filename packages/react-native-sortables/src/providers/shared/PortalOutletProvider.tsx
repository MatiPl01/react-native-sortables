import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';

import type { PortalOutletContextType } from '../../types';
import { createProvider } from '../utils';

type PortalOutletProps = {
  children: ReactNode;
};

const { PortalOutletProvider, usePortalOutletContext } = createProvider(
  'PortalOutlet',
  { guarded: false }
)<PortalOutletProps, PortalOutletContextType>(({ children }) => {
  const portalOutletRef = useAnimatedRef<View>();

  return {
    children: (
      <View collapsable={false} ref={portalOutletRef} style={styles.container}>
        {children}
      </View>
    ),
    value: {
      portalOutletRef
    }
  };
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none'
  }
});

export { PortalOutletProvider, usePortalOutletContext };
