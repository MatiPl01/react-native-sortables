import { LayoutAnimationConfig } from 'react-native-reanimated';

import { useTeleportedItemLayout } from '../../../providers';
import type { ItemCellProps } from './ItemCell';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = Pick<
  ItemCellProps,
  | 'activationAnimationProgress'
  | 'baseStyle'
  | 'children'
  | 'isActive'
  | 'itemKey'
>;

export default function TeleportedItemCell({
  activationAnimationProgress,
  baseStyle,
  children,
  isActive,
  itemKey
}: TeleportedItemCellProps) {
  const teleportedItemLayoutValue = useTeleportedItemLayout(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  return (
    <ItemCell
      activationAnimationProgress={activationAnimationProgress}
      baseStyle={baseStyle}
      isActive={isActive}
      itemKey={itemKey}
      layoutStyleValue={teleportedItemLayoutValue}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
