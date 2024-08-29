import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import type { Maybe, Vector } from '../../types';
import type { WrappedProps } from '../types';
import type { DebugLineProps } from './DebugLine';
import DebugLine from './DebugLine';

export type DebugCrossProps = (
  | {
      x: Maybe<number>;
      y: Maybe<number>;
      position?: never;
    }
  | {
      x?: never;
      y?: never;
      position: Maybe<Vector>;
    }
) &
  Pick<DebugLineProps, 'color' | 'opacity' | 'style' | 'thickness' | 'visible'>;

export default function DebugCross({ props }: WrappedProps<DebugCrossProps>) {
  const horizontalLineProps = useDerivedValue(() => ({
    ...props.value,
    y: props.value.position?.y ?? props.value.y
  }));
  const verticalLineProps = useDerivedValue(() => ({
    ...props.value,
    x: props.value.position?.x ?? props.value.x
  }));

  return (
    <>
      <DebugLine props={horizontalLineProps as SharedValue<DebugLineProps>} />
      <DebugLine props={verticalLineProps as SharedValue<DebugLineProps>} />
    </>
  );
}
