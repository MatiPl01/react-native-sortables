import { memo, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { UnAnimatableValues } from '../../types';
import { useSplitSharedValue } from '../../utils';
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
            return <WrappedDebugCross key={key} props={props} />;
          case DebugComponentType.Line:
            return <WrappedDebugLine key={key} props={props} />;
          case DebugComponentType.Rect:
            return <WrappedDebugRect key={key} props={props} />;
        }
      })}
    </>
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Wrapped<P extends Record<string, any>> = {
  props: SharedValue<Partial<UnAnimatableValues<P>>>;
};

function WrappedDebugLine({ props }: Wrapped<DebugLineProps>) {
  return <DebugLine {...(useSplitSharedValue(props) as DebugLineProps)} />;
}

function WrappedDebugRect({ props }: Wrapped<DebugRectProps>) {
  return <DebugRect {...(useSplitSharedValue(props) as DebugRectProps)} />;
}

function WrappedDebugCross({ props }: Wrapped<DebugCrossProps>) {
  return <DebugCross {...(useSplitSharedValue(props) as DebugCrossProps)} />;
}

export default DebugOutlet;
