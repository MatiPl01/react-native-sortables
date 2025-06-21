import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { Vector } from './layout/shared';
import type { Maybe } from './utils';

export enum DebugComponentType {
  CROSS = 'cross',
  LINE = 'line',
  RECT = 'rect'
}

export type DebugCrossProps = Pick<
  DebugLineProps,
  'color' | 'opacity' | 'style' | 'thickness' | 'visible'
> & {
  isAbsolute?: boolean;
} & (
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
  );

export type DebugLineProps = {
  isAbsolute?: boolean;
  visible?: boolean;
  color?: ViewStyle['borderColor'];
  thickness?: number;
  style?: ViewStyle['borderStyle'];
  opacity?: number;
} & (
  | {
      from: Maybe<Vector>;
      to: Maybe<Vector>;
      x?: never;
      y?: never;
    }
  | {
      x: Maybe<number>;
      y?: never;
      from?: never;
      to?: never;
    }
  | {
      x?: never;
      y: Maybe<number>;
      from?: never;
      to?: never;
    }
);

export type DebugRectProps = Pick<
  ViewStyle,
  'backgroundColor' | 'borderColor' | 'borderStyle' | 'borderWidth'
> & {
  isAbsolute?: boolean;
  backgroundOpacity?: number;
  visible?: boolean;
} & (
    | {
        from: Maybe<Vector>;
        to: Maybe<Vector>;
        x?: never;
        y?: never;
        width?: never;
        height?: never;
        positionOrigin?: never;
      }
    | {
        x: Maybe<number>;
        y: Maybe<number>;
        from?: never;
        to?: never;
        width: Maybe<number>;
        height: Maybe<number>;
        positionOrigin?: `${'left' | 'right'} ${'bottom' | 'top'}`;
      }
    | {
        x: Maybe<number>;
        y?: never;
        from?: never;
        to?: never;
        width: Maybe<number>;
        height?: never;
        positionOrigin?: `${'left' | 'right'}`;
      }
    | {
        x?: never;
        y: Maybe<number>;
        from?: never;
        to?: never;
        width?: never;
        height: Maybe<number>;
        positionOrigin?: `${'bottom' | 'top'}`;
      }
  );

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
