/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SharedValue } from 'react-native-reanimated';

import type {
  DebugCrossProps,
  DebugLineProps,
  DebugRectProps
} from './components';

export enum DebugComponentType {
  Cross = 'cross',
  Line = 'line',
  Rect = 'rect'
}

export type WrappedProps<P> = { props: SharedValue<P> };

type CreateDebugComponentUpdater<
  T extends DebugComponentType,
  P extends Record<string, any>
> = {
  props: SharedValue<P>;
  hide: () => void;
  set: (props: ((prevProps: P) => P) | P) => void;
  type: T;
};

export type DebugComponentUpdater<T extends DebugComponentType> =
  T extends DebugComponentType.Line
    ? CreateDebugComponentUpdater<T, DebugLineProps>
    : T extends DebugComponentType.Rect
      ? CreateDebugComponentUpdater<T, DebugRectProps>
      : T extends DebugComponentType.Cross
        ? CreateDebugComponentUpdater<T, DebugCrossProps>
        : never;

export type DebugLineUpdater = DebugComponentUpdater<DebugComponentType.Line>;
export type DebugRectUpdater = DebugComponentUpdater<DebugComponentType.Rect>;
export type DebugCrossUpdater = DebugComponentUpdater<DebugComponentType.Cross>;

export type DebugViews = Record<
  number,
  DebugComponentUpdater<DebugComponentType>
>;
