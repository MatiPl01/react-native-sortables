/* eslint-disable import/no-unused-modules */
import { isSharedValue, useDerivedValue } from 'react-native-reanimated';

import type { Animatable, Maybe, Vector } from '../../types';
import type { DebugLineProps } from './DebugLine';
import DebugLine from './DebugLine';

export type DebugCrossProps = (
  | {
      x: Animatable<Maybe<number>>;
      y: Animatable<Maybe<number>>;
      position?: never;
    }
  | {
      x?: never;
      y?: never;
      position: Animatable<Maybe<Vector>>;
    }
) &
  Pick<DebugLineProps, 'color' | 'opacity' | 'style' | 'thickness' | 'visible'>;

export default function DebugCross({
  position,
  x: x_,
  y: y_,
  ...lineProps
}: DebugCrossProps) {
  const x = useDerivedValue(() =>
    position
      ? isSharedValue(position)
        ? position.value?.x
        : position.x
      : isSharedValue(x_)
        ? x_.value
        : x_
  );
  const y = useDerivedValue(() =>
    position
      ? isSharedValue(position)
        ? position.value?.y
        : position.y
      : isSharedValue(y_)
        ? y_.value
        : y_
  );

  return (
    <>
      <DebugLine x={x} {...lineProps} />
      <DebugLine y={y} {...lineProps} />
    </>
  );
}
