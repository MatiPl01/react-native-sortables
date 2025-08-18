/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { useAnimatableValue } from '../../integrations/reanimated';
import type { ReorderTriggerOrigin, SortableGridStrategy } from '../../types';
import type { SharedProviderProps } from '../shared';
import {
  SharedProvider,
  useCommonValuesContext,
  useOrderUpdater,
  useStrategyKey
} from '../shared';
import { ContextProviderComposer } from '../utils';
import {
  AdditionalCrossOffsetProvider,
  useAdditionalCrossOffsetContext
} from './AdditionalCrossOffsetProvider';
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
  reorderTriggerOrigin,
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
      <GridProviderInner
        key={useStrategyKey(strategy)}
        reorderTriggerOrigin={reorderTriggerOrigin}
        strategy={strategy}>
        {children}
      </GridProviderInner>
    </ContextProviderComposer>
  );
}

type GridProviderInnerProps = PropsWithChildren<{
  strategy: SortableGridStrategy;
  reorderTriggerOrigin: ReorderTriggerOrigin;
}>;

function GridProviderInner({
  children,
  reorderTriggerOrigin,
  strategy
}: GridProviderInnerProps) {
  const { activeAnimationProgress, activeItemDimensions, activeItemPosition } =
    useCommonValuesContext();
  const { additionalCrossSnapOffset } = useAdditionalCrossOffsetContext() ?? {};

  const triggerOrigin = useDerivedValue(() => {
    if (reorderTriggerOrigin !== 'center') {
      return reorderTriggerOrigin;
    }

    if (!activeItemPosition.value || !activeItemDimensions.value) {
      return null;
    }

    return {
      x: activeItemPosition.value.x + activeItemDimensions.value.width / 2,
      y:
        activeItemPosition.value.y +
        activeItemDimensions.value.height / 2 +
        (additionalCrossSnapOffset?.value ?? 0) * activeAnimationProgress.value
    };
  });

  useOrderUpdater(strategy, GRID_STRATEGIES, triggerOrigin);

  return <>{children}</>;
}
