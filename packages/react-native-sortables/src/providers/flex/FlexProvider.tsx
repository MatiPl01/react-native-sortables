/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import type {
  DragEndCallback,
  ReorderTriggerOrigin,
  SortableFlexStrategy
} from '../../types';
import type { SharedProviderProps } from '../shared';
import { SharedProvider, useOrderUpdater, useStrategyKey } from '../shared';
import { ContextProviderComposer } from '../utils';
import type { FlexLayoutProviderProps } from './layout';
import { FLEX_STRATEGIES, FlexLayoutProvider } from './layout';

type FlexProviderProps = PropsWithChildren<
  SharedProviderProps & {
    styleProps: Omit<FlexLayoutProviderProps, 'itemsCount'>;
    itemKeys: Array<string>;
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
    <SharedProvider {...sharedProps} />,
    <FlexLayoutProvider
      {...styleProps}
      itemsCount={sharedProps.itemKeys.length}
    />
  ];

  return (
    <ContextProviderComposer providers={providers}>
      <FlexProviderInner key={useStrategyKey(strategy)} strategy={strategy}>
        {children}
      </FlexProviderInner>
    </ContextProviderComposer>
  );
}

type FlexProviderInnerProps = PropsWithChildren<{
  strategy: SortableFlexStrategy;
}>;

function FlexProviderInner({ children, strategy }: FlexProviderInnerProps) {
  useOrderUpdater(strategy, FLEX_STRATEGIES);

  return <>{children}</>;
}
