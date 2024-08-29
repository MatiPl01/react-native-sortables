/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SharedValue } from 'react-native-reanimated';

import type { UnAnimatableValues } from '../types';
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

type CreateDebugComponentUpdater<
  T extends DebugComponentType,
  P extends Record<string, any>
> = {
  props: SharedValue<Partial<UnAnimatableValues<P>>>;
  update: (
    props:
      | ((
          prevProps: Partial<UnAnimatableValues<P>>
        ) => Partial<UnAnimatableValues<P>>)
      | Partial<UnAnimatableValues<P>>
  ) => void;
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
