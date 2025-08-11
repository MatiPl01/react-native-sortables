/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import type { ReorderTriggerOrigin, SortableGridStrategy } from '../../types';
import type { SharedProviderProps } from '../shared';
import {
  OrderUpdaterComponent,
  SharedProvider,
  useStrategyKey
} from '../shared';
import { ContextProviderComposer } from '../utils';
import type { GridLayoutProviderProps } from './layout';
import { GRID_STRATEGIES, GridLayoutProvider } from './layout';

type GridProviderProps = PropsWithChildren<
  GridLayoutProviderProps &
    SharedProviderProps & {
      strategy: SortableGridStrategy;
      reorderTriggerOrigin: ReorderTriggerOrigin;
    }
>;

export default function GridProvider({
  children,
  columnGap,
  isVertical,
  numGroups,
  numItems,
  reorderTriggerOrigin,
  rowGap,
  rowHeight,
  strategy,
  ...sharedProps
}: GridProviderProps) {
  const providers = [
    <SharedProvider {...sharedProps} />,
    <GridLayoutProvider
      columnGap={columnGap}
      isVertical={isVertical}
      numGroups={numGroups}
      numItems={numItems}
      rowGap={rowGap}
      rowHeight={rowHeight}
    />
  ];

  return (
    <ContextProviderComposer providers={providers}>
      <OrderUpdaterComponent
        key={useStrategyKey(strategy)}
        predefinedStrategies={GRID_STRATEGIES}
        strategy={strategy}
        triggerOrigin={reorderTriggerOrigin}
      />
      {children}
    </ContextProviderComposer>
  );
}
