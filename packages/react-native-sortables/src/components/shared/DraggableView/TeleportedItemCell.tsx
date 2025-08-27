import { LayoutAnimationConfig } from 'react-native-reanimated';

import { useTeleportedItemStyles } from '../../../providers';
import type { ItemCellProps } from './ItemCell';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = Pick<
  ItemCellProps,
  | 'activationAnimationProgress'
  | 'cellStyle'
  | 'children'
  | 'innerCellStyle'
  | 'isActive'
  | 'itemKey'
  | 'onLayout'
>;

export default function TeleportedItemCell({
  activationAnimationProgress,
  cellStyle,
  children,
  innerCellStyle,
  isActive,
  itemKey,
  onLayout
}: TeleportedItemCellProps) {
  const teleportedItemStyles = useTeleportedItemStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  return (
    <ItemCell
      activationAnimationProgress={activationAnimationProgress}
      cellStyle={[cellStyle, teleportedItemStyles]}
      innerCellStyle={innerCellStyle}
      isActive={isActive}
      itemKey={itemKey}
      onLayout={onLayout}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
