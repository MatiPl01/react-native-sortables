import type { PropsWithChildren } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import type { AnimatedStyleProp } from '../../../integrations/reanimated';
import { useTeleportedItemStyles } from '../../../providers';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = PropsWithChildren<{
  activationAnimationProgress: SharedValue<number>;
  baseCellStyle: AnimatedStyleProp;
  isActive: SharedValue<boolean>;
  itemKey: string;
}>;

export default function TeleportedItemCell({
  activationAnimationProgress,
  baseCellStyle,
  children,
  isActive,
  itemKey
}: TeleportedItemCellProps) {
  const teleportedItemStyles = useTeleportedItemStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  return (
    <ItemCell cellStyle={[baseCellStyle, teleportedItemStyles]}>
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </ItemCell>
  );
}
