/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import { useAnimatableValue } from '../../integrations/reanimated';
import type { ReorderTriggerOrigin, SortableGridStrategy } from '../../types';
import type { SharedProviderProps } from '../shared';
import { SharedProvider, useOrderUpdater, useStrategyKey } from '../shared';
import { ContextProviderComposer } from '../utils';
import { AdditionalCrossOffsetProvider } from './AdditionalCrossOffsetProvider';
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
  columnGap: columnGap_,
  isVertical,
  numGroups,
  numItems,
  rowGap: rowGap_,
  rowHeight,
  strategy,
  ...sharedProps
}: GridProviderProps) {
  const rowGap = useAnimatableValue(rowGap_);
  const columnGap = useAnimatableValue(columnGap_);

  const sharedGridProviderProps = {
    columnGap,
    isVertical,
    numGroups,
    rowGap
  };

  const providers = [
    <SharedProvider {...sharedProps} />,
    <AdditionalCrossOffsetProvider {...sharedGridProviderProps} />,
    <GridLayoutProvider
      {...sharedGridProviderProps}
      numItems={numItems}
      rowHeight={rowHeight}
    />
  ];

  return (
    <ContextProviderComposer providers={providers}>
      <GridProviderInner key={useStrategyKey(strategy)} strategy={strategy}>
        {children}
      </GridProviderInner>
    </ContextProviderComposer>
  );
}

type GridProviderInnerProps = PropsWithChildren<{
  strategy: SortableGridStrategy;
}>;

function GridProviderInner({ children, strategy }: GridProviderInnerProps) {
  useOrderUpdater(strategy, GRID_STRATEGIES);

  return <>{children}</>;
}
