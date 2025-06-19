import type { SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import {
  useItemDecorationStyles,
  usePortalContext,
  useTeleportedItemStyles
} from '../../../providers';
import type { AnimatedStyleProp } from '../../../types';
import type { ItemCellProps } from './ItemCell';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = Omit<
  ItemCellProps,
  | 'cellStyle'
  | 'decorationStyles'
  | 'entering'
  | 'exiting'
  | 'layout'
  | 'onMeasure'
> & {
  activationAnimationProgress: SharedValue<number>;
  baseCellStyle: AnimatedStyleProp;
  isActive: SharedValue<boolean>;
  teleportedItemId: string;
  itemKey: string;
};

export default function TeleportedItemCell({
  activationAnimationProgress,
  baseCellStyle,
  children,
  isActive,
  itemKey,
  itemsOverridesStyle,
  teleportedItemId
}: TeleportedItemCellProps) {
  const { notifyRendered } = usePortalContext() ?? {};

  const teleportedItemStyles = useTeleportedItemStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );
  const decorationStyles = useItemDecorationStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  if (!notifyRendered) {
    return null;
  }

  return (
    <ItemCell
      cellStyle={[baseCellStyle, teleportedItemStyles]}
      decorationStyles={decorationStyles}
      itemsOverridesStyle={itemsOverridesStyle}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
