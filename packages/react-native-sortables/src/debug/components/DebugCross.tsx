import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import type {
  DebugCrossProps,
  DebugLineProps,
  WrappedProps
} from '../../types/debug';
import DebugLine from './DebugLine';

export default function DebugCross({ props }: WrappedProps<DebugCrossProps>) {
  const sharedProps = useDerivedValue(() => ({
    ...props.value,
    x: props.value.position?.x ?? props.value.x,
    y: props.value.position?.y ?? props.value.y
  }));

  const horizontalLineProps = useDerivedValue(() => ({
    ...sharedProps.value,
    type: 'horizontal'
  }));

  const verticalLineProps = useDerivedValue(() => ({
    ...sharedProps.value,
    type: 'vertical'
  }));

  return (
    <>
      <DebugLine props={horizontalLineProps as SharedValue<DebugLineProps>} />
      <DebugLine props={verticalLineProps as SharedValue<DebugLineProps>} />
    </>
  );
}
