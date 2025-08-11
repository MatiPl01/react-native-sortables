/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import type {
  DragEndCallback,
  ReorderTriggerOrigin,
  SortableFlexStrategy
} from '../../types';
import type { SharedProviderProps } from '../shared';
import {
  OrderUpdaterComponent,
  SharedProvider,
  useStrategyKey
} from '../shared';
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
  reorderTriggerOrigin,
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
      <OrderUpdaterComponent
        key={useStrategyKey(strategy)}
        predefinedStrategies={FLEX_STRATEGIES}
        strategy={strategy}
        triggerOrigin={reorderTriggerOrigin}
      />
      {children}
    </ContextProviderComposer>
  );
}
