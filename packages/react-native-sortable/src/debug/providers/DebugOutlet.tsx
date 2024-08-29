import { memo, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type {
  DebugCrossProps,
  DebugLineProps,
  DebugRectProps
} from '../components';
import { DebugCross, DebugLine, DebugRect } from '../components';
import { DebugComponentType, type DebugViews } from '../types';
import { useDebugContext } from './DebugProvider';

const DebugOutlet = memo(function DebugOutlet() {
  const [debugViews, setDebugViews] = useState<DebugViews>({});
  const { useObserver } = useDebugContext() ?? {};

  useObserver?.(setDebugViews);

  return (
    <>
      {Object.entries(debugViews).map(([key, { props, type }]) => {
        switch (type) {
          case DebugComponentType.Cross:
            return (
              <DebugCross
                key={key}
                props={props as SharedValue<DebugCrossProps>}
              />
            );
          case DebugComponentType.Line:
            return (
              <DebugLine
                key={key}
                props={props as SharedValue<DebugLineProps>}
              />
            );
          case DebugComponentType.Rect:
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
