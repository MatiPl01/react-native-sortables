import type { SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import {
  usePortalContext,
  useTeleportedItemId,
  useTeleportedItemStyles
} from '../../../providers';
import type { AnimatedStyleProp } from '../../../types';
import type { ItemCellProps } from './ItemCell';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = {
  activationAnimationProgress: SharedValue<number>;
  baseCellStyle: AnimatedStyleProp;
  isActive: SharedValue<boolean>;
  itemKey: string;
} & Omit<ItemCellProps, 'cellStyle' | 'entering' | 'exiting' | 'layout'>;

export default function TeleportedItemCell({
  activationAnimationProgress,
  baseCellStyle,
  children,
  decorationStyle,
  isActive,
  itemKey,
  itemsOverridesStyle,
  onMeasure
}: TeleportedItemCellProps) {
  const teleportedItemId = useTeleportedItemId(itemKey);
  const { notifyRendered } = usePortalContext()!;

  const teleportedItemStyles = useTeleportedItemStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  return (
    <ItemCell
      cellStyle={[baseCellStyle, teleportedItemStyles]}
      decorationStyle={decorationStyle}
      itemsOverridesStyle={itemsOverridesStyle}
      onMeasure={(width, height) => {
        onMeasure(width, height);
        // Mark the teleported item as rendered only after it appeared
        // on the screen and its layout calculation is completed
        // (see useTeleportedItemStyles in which we set display property
        // to 'none' when the animated style is not ready)
        notifyRendered(teleportedItemId);
      }}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
