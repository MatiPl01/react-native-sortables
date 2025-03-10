import type { SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useTeleportedItemStyles
} from '../../../providers';
import type { AnimatedStyleProp } from '../../../types';
import type { ItemCellProps } from './ItemCell';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = {
  activationAnimationProgress: SharedValue<number>;
  baseCellStyle: AnimatedStyleProp;
  isActive: SharedValue<boolean>;
} & Omit<ItemCellProps, 'cellStyle' | 'entering' | 'exiting' | 'layout'>;

export default function TeleportedItemCell({
  activationAnimationProgress,
  baseCellStyle,
  children,
  decorationStyle,
  handleItemMeasurement,
  isActive,
  itemKey
}: TeleportedItemCellProps) {
  const { itemsOverridesStyle } = useCommonValuesContext();

  const teleportedItemStyles = useTeleportedItemStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  return (
    <ItemCell
      cellStyle={[baseCellStyle, teleportedItemStyles]}
      decorationStyle={decorationStyle}
      handleItemMeasurement={handleItemMeasurement}
      itemKey={itemKey}
      itemsOverridesStyle={itemsOverridesStyle}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
