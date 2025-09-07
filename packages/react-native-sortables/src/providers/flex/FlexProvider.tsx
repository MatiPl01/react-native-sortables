/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import type {
  DragEndCallback,
  ReorderTriggerOrigin,
  SortableFlexStrategy
} from '../../types';
import type { SharedProviderProps } from '../shared';
import { SharedProvider } from '../shared';
import { ContextProviderComposer } from '../utils';
import type { FlexLayoutProviderProps } from './FlexLayoutProvider';
import { FlexLayoutProvider } from './FlexLayoutProvider';

type FlexProviderProps = PropsWithChildren<
  SharedProviderProps & {
    styleProps: Omit<FlexLayoutProviderProps, 'itemsCount'>;
    reorderTriggerOrigin: ReorderTriggerOrigin;
    strategy: SortableFlexStrategy;
    onDragEnd: DragEndCallback;
  }
>;

export default function FlexProvider({
  children,
  strategy,
  styleProps,
  ...sharedProps
}: FlexProviderProps) {
  const providers = [
    // Provider with common sortables functionality
    <SharedProvider {...sharedProps} />,
    // Provider with flex layout calculations
    <FlexLayoutProvider {...styleProps} />
  ];

  return (
    <ContextProviderComposer providers={providers}>
      {children}
    </ContextProviderComposer>
  );
}
