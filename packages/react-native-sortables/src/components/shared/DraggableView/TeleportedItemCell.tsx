import type { PropsWithChildren } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { useTeleportedItemStyles } from '../../../providers';
import type { AnimatedStyleProp, MeasureCallback } from '../../../types';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = PropsWithChildren<{
  activationAnimationProgress: SharedValue<number>;
  baseCellStyle: AnimatedStyleProp;
  isActive: SharedValue<boolean>;
  itemKey: string;
  onMeasure: MeasureCallback;
}>;

export default function TeleportedItemCell({
  activationAnimationProgress,
  baseCellStyle,
  children,
  isActive,
  itemKey,
  onMeasure
}: TeleportedItemCellProps) {
  const teleportedItemStyles = useTeleportedItemStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  return (
    <ItemCell
      cellStyle={[baseCellStyle, teleportedItemStyles]}
      onMeasure={onMeasure}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
