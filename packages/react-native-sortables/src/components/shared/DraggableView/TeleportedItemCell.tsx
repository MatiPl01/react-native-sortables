import type { SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import {
  useCommonValuesContext,
  usePortalContext,
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
  handleItemMeasurement: handleItemMeasurement_,
  isActive,
  itemKey
}: TeleportedItemCellProps) {
  const { notifyRendered } = usePortalContext()!;
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
      itemKey={itemKey}
      itemsOverridesStyle={itemsOverridesStyle}
      handleItemMeasurement={(key, dimensions) => {
        handleItemMeasurement_(key, dimensions);
        // Mark the teleported item as rendered only after it appeared
        // on the screen and its layout calculation is completed
        // (see useTeleportedItemStyles in which we set display property
        // to 'none' when the animated style is not ready)
        notifyRendered(key);
      }}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
