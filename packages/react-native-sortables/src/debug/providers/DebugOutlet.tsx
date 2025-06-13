import { memo, useCallback, useState } from 'react';

import type { DebugViews } from '../../types/debug';
import { DebugComponentType } from '../../types/debug';
import { DebugCross, DebugLine, DebugRect } from '../components';
import { useDebugContext } from './DebugProvider';

const DebugOutlet = memo(function DebugOutlet() {
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
            return <DebugCross key={key} props={props} />;
          case DebugComponentType.LINE:
            return <DebugLine key={key} props={props} />;
          case DebugComponentType.RECT:
            return <DebugRect key={key} props={props} />;
        }
      })}
    </>
  );
});

export default DebugOutlet;
