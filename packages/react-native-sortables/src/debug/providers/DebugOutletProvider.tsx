import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';

import { createProvider } from '../../providers/utils';
import type { DebugOutletContextType } from '../../types';
import type { DebugViews } from '../../types/debug';
import { DebugComponentType } from '../../types/debug';
import { DebugCross, DebugLine, DebugRect } from '../components';
import { useDebugContext } from './DebugProvider';

const { DebugOutletProvider, useDebugOutletContext } = createProvider(
  'DebugOutlet',
  { guarded: false }
)<object, DebugOutletContextType>(() => {
  const { useObserver } = useDebugContext() ?? {};

  const [debugViews, setDebugViews] = useState<DebugViews>({});
  const debugOutletRef = useAnimatedRef<View>();

  const observer = useCallback((views: DebugViews) => {
    setDebugViews(views);
  }, []);

  useObserver?.(observer);

  const children = useMemo(
    () => (
      <View ref={debugOutletRef} style={styles.container}>
        {Object.entries(debugViews).map(([key, { props, type }]) => {
          switch (type) {
            case DebugComponentType.CROSS:
              return <DebugCross key={key} props={props} />;
            case DebugComponentType.LINE:
              return <DebugLine key={key} props={props} />;
            case DebugComponentType.RECT:
              return <DebugRect key={key} props={props} />;
          }
        })}
      </View>
    ),
    [debugViews, debugOutletRef]
  );

  return {
    children,
    value: {
      debugOutletRef
    }
  };
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 1000
  }
});

export { DebugOutletProvider, useDebugOutletContext };
