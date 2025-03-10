/* eslint-disable import/no-unused-modules */
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useMeasurementsContext,
  usePortalContext,
  useTeleportedItemStyles
} from '../../../providers';
import ItemCell from './ItemCell';

type TeleportedItemCellProps = PropsWithChildren<{
  itemKey: string;
  isActive: SharedValue<boolean>;
  activationAnimationProgress: SharedValue<number>;
  baseCellStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  decorationStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  onRender: () => void;
}>;

export default function TeleportedItemCell({
  activationAnimationProgress,
  baseCellStyle,
  children,
  decorationStyle,
  isActive,
  itemKey,
  onRender
}: TeleportedItemCellProps) {
  const { teleport } = usePortalContext()!;
  const { itemsOverridesStyle } = useCommonValuesContext();
  const { handleItemMeasurement } = useMeasurementsContext();

  const teleportedItemStyles = useTeleportedItemStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  useEffect(() => {
    teleport(
      itemKey,
      <LayoutAnimationConfig skipEntering skipExiting>
        <ItemCell
          cellStyle={[baseCellStyle, teleportedItemStyles]}
          decorationStyle={decorationStyle}
          handleItemMeasurement={handleItemMeasurement}
          itemKey={itemKey}
          itemsOverridesStyle={itemsOverridesStyle}>
          {children}
        </ItemCell>
      </LayoutAnimationConfig>,
      onRender
    );

    return () => teleport(itemKey, null);
  }, [
    baseCellStyle,
    itemKey,
    teleport,
    onRender,
    teleportedItemStyles,
    decorationStyle,
    handleItemMeasurement,
    itemsOverridesStyle,
    children
  ]);

  return null;
}
