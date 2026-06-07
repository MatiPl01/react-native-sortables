import { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DebugViews } from '../../types/debug';
import { DebugComponentType } from '../../types/debug';
import { DebugCross, DebugLine, DebugRect } from '../components';
import { useDebugContext } from './DebugProvider';

function DebugOutlet() {
  const [debugViews, setDebugViews] = useState<DebugViews>({});
  const { debugOutletRef, useObserver } = useDebugContext() ?? {};

  const observer = useCallback((views: DebugViews) => {
    setDebugViews(views);
  }, []);

  useObserver?.(observer);

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0
  }
});

export default memo(DebugOutlet);
