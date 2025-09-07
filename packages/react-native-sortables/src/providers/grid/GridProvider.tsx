/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import { useAnimatableValue } from '../../integrations/reanimated';
import type { ReorderTriggerOrigin, SortableGridStrategy } from '../../types';
import type { SharedProviderProps } from '../shared';
import { SharedProvider } from '../shared';
import { ContextProviderComposer } from '../utils';
import { AdditionalCrossOffsetProvider } from './AdditionalCrossOffsetProvider';
import type { GridLayoutProviderProps } from './GridLayoutProvider';
import { GridLayoutProvider } from './GridLayoutProvider';

export type GridProviderProps = PropsWithChildren<
  GridLayoutProviderProps &
    SharedProviderProps & {
      strategy: SortableGridStrategy;
      reorderTriggerOrigin: ReorderTriggerOrigin;
      autoAdjustOffsetDuringDrag: boolean;
    }
>;

export default function GridProvider({
  autoAdjustOffsetDuringDrag,
  children,
  columnGap: columnGap_,
  isVertical,
  numGroups,
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
    // Provider with common sortables functionality
    <SharedProvider {...sharedProps} />,
    // Provider with additional cross axis offset calculations to support
    // collapsible items
    autoAdjustOffsetDuringDrag && (
      <AdditionalCrossOffsetProvider {...sharedGridProviderProps} />
    ),
    // Provider with grid layout calculations
    <GridLayoutProvider {...sharedGridProviderProps} rowHeight={rowHeight} />
  ];

  return (
    <ContextProviderComposer providers={providers}>
      {children}
    </ContextProviderComposer>
  );
}
