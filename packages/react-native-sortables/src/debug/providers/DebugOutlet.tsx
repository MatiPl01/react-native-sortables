import { useCallback, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type {
  DebugCrossProps,
  DebugLineProps,
  DebugRectProps,
  DebugViews
} from '../../types/debug';
import { DebugComponentType } from '../../types/debug';
import { typedMemo } from '../../utils';
import { DebugCross, DebugLine, DebugRect } from '../components';
import { useDebugContext } from './DebugProvider';

const DebugOutlet = typedMemo(function DebugOutlet() {
  const [debugViews, setDebugViews] = useState<DebugViews>({});
  const { useObserver } = useDebugContext() ?? {};

  const observer = useCallback((views: DebugViews) => {
    setDebugViews(views);
  }, []);

  useObserver?.(observer);

  return (
    <>
      {Object.entries(debugViews).map(([key, { props, type }]) => {
        switch (type) {
          case DebugComponentType.CROSS:
            return (
              <DebugCross
                key={key}
                props={props as SharedValue<DebugCrossProps>}
              />
            );
          case DebugComponentType.LINE:
            return (
              <DebugLine
                key={key}
                props={props as SharedValue<DebugLineProps>}
              />
            );
          case DebugComponentType.RECT:
            return (
              <DebugRect
                key={key}
                props={props as SharedValue<DebugRectProps>}
              />
            );
        }
      })}
    </>
  );
});

export default DebugOutlet;
