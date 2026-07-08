import type { PropsWithChildren } from 'react';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import type { SortableGesture } from '../../../integrations/gesture-handler';
import {
  CommonValuesContext,
  ItemContextProvider,
  useTeleportedItemLayout
} from '../../../providers';
import type { CommonValuesContextType } from '../../../types';
import { getContextProvider } from '../../../utils';
import type { ItemCellProps } from './ItemCell';
import ItemCell from './ItemCell';

const CommonValuesContextProvider = getContextProvider(CommonValuesContext);

type TeleportedItemCellProps = PropsWithChildren<
  Pick<
    ItemCellProps,
    'activationAnimationProgress' | 'baseStyle' | 'isActive' | 'itemKey'
  > & {
    commonValuesContext: CommonValuesContextType;
    gesture: SortableGesture;
  }
>;

// Rendered in the portal outlet (a different subtree), so it re-provides the
// contexts the cell and the user's renderItem depend on.
export default function TeleportedItemCell({
  activationAnimationProgress,
  baseStyle,
  children,
  commonValuesContext,
  gesture,
  isActive,
  itemKey
}: TeleportedItemCellProps) {
  return (
    <CommonValuesContextProvider value={commonValuesContext}>
      <ItemContextProvider
        activationAnimationProgress={activationAnimationProgress}
        gesture={gesture}
        isActive={isActive}
        itemKey={itemKey}>
        <TeleportedItemCellContent
          activationAnimationProgress={activationAnimationProgress}
          baseStyle={baseStyle}
          isActive={isActive}
          itemKey={itemKey}>
          {children}
        </TeleportedItemCellContent>
      </ItemContextProvider>
    </CommonValuesContextProvider>
  );
}

type TeleportedItemCellContentProps = PropsWithChildren<
  Pick<
    ItemCellProps,
    'activationAnimationProgress' | 'baseStyle' | 'isActive' | 'itemKey'
  >
>;

function TeleportedItemCellContent({
  activationAnimationProgress,
  baseStyle,
  children,
  isActive,
  itemKey
}: TeleportedItemCellContentProps) {
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
