import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { useTeleportedItemStyles } from '../../../providers';
import type { AnimatedStyleProp, MeasureCallback } from '../../../types';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = PropsWithChildren<{
  itemsOverridesStyle: AnimatedStyle<ViewStyle>;
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
  itemsOverridesStyle,
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
      itemsOverridesStyle={itemsOverridesStyle}
      onMeasure={onMeasure}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
