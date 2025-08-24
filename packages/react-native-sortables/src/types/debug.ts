import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { Maybe, MutuallyExclusiveUnion } from '../helperTypes';
import type { Vector } from './layout/shared';

export enum DebugComponentType {
  CROSS = 'cross',
  LINE = 'line',
  RECT = 'rect'
}

export type DebugCrossProps = MutuallyExclusiveUnion<
  [
    {
      x: Maybe<number>;
      y: Maybe<number>;
    },
    {
      position: Maybe<Vector>;
    }
  ]
> &
  Pick<
    DebugLineProps,
    'color' | 'opacity' | 'style' | 'thickness' | 'visible'
  > & {
    isAbsolute?: boolean;
  };

export type DebugLineProps = MutuallyExclusiveUnion<
  [
    {
      from: Maybe<Vector>;
      to: Maybe<Vector>;
    },
    {
      x: Maybe<number>;
    },
    {
      y: Maybe<number>;
    }
  ]
> & {
  isAbsolute?: boolean;
  visible?: boolean;
  color?: ViewStyle['borderColor'];
  thickness?: number;
  style?: ViewStyle['borderStyle'];
  opacity?: number;
};

export type DebugRectProps = MutuallyExclusiveUnion<
  [
    {
      from: Maybe<Vector>;
      to: Maybe<Vector>;
    },
    {
      x: Maybe<number>;
      y: Maybe<number>;
      width: Maybe<number>;
      height: Maybe<number>;
      positionOrigin?: `${'left' | 'right'} ${'bottom' | 'top'}`;
    },
    {
      x: Maybe<number>;
      width: Maybe<number>;
      positionOrigin?: `${'left' | 'right'}`;
    },
    {
      y: Maybe<number>;
      height: Maybe<number>;
      positionOrigin?: `${'bottom' | 'top'}`;
    }
  ]
> &
  Pick<
    ViewStyle,
    'backgroundColor' | 'borderColor' | 'borderStyle' | 'borderWidth'
  > & {
    isAbsolute?: boolean;
    backgroundOpacity?: number;
    visible?: boolean;
  };

export type WrappedProps<P> = { props: SharedValue<P> };

type CreateDebugComponentUpdater<
  T extends DebugComponentType,
  P extends { isAbsolute?: boolean }
> = {
  props: SharedValue<P>;
  hide: () => void;
  set: (props: ((prevProps: P) => P) | P) => void;
  type: T;
};

export type DebugComponentUpdater<T extends DebugComponentType> =
  T extends DebugComponentType.LINE
    ? CreateDebugComponentUpdater<T, DebugLineProps>
    : T extends DebugComponentType.RECT
      ? CreateDebugComponentUpdater<T, DebugRectProps>
      : T extends DebugComponentType.CROSS
        ? CreateDebugComponentUpdater<T, DebugCrossProps>
        : never;

export type DebugLineUpdater = DebugComponentUpdater<DebugComponentType.LINE>;
export type DebugCrossUpdater = DebugComponentUpdater<DebugComponentType.CROSS>;
export type DebugRectUpdater = DebugComponentUpdater<DebugComponentType.RECT>;

export type DebugViews = Record<
  number,
  DebugComponentUpdater<DebugComponentType>
>;
