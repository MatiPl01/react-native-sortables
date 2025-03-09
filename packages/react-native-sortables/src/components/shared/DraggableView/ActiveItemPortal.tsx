import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import {
  LayoutAnimationConfig,
  runOnJS,
  useAnimatedReaction
} from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useItemContext,
  useMeasurementsContext,
  usePortalContext,
  useTeleportedItemStyles
} from '../../../providers';
import { CellComponent } from './CellComponent';

type ActiveItemPortalProps = PropsWithChildren<{
  cellStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  decorationStyle: StyleProp<AnimatedStyle<ViewStyle>>;
}>;

export default function ActiveItemPortal({
  children,
  ...rest
}: ActiveItemPortalProps) {
  const { activationAnimationProgress, isActive, itemKey } = useItemContext();
  const [isTeleported, setIsTeleported] = useState(false);

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    progress => {
      if (progress > 0 && !isTeleported) {
        runOnJS(setIsTeleported)(true);
      } else if (progress === 0 && isTeleported) {
        runOnJS(setIsTeleported)(false);
      }
    }
  );

  return isTeleported ? (
    <TeleportedCell
      {...rest}
      activationAnimationProgress={activationAnimationProgress}
      isActive={isActive}
      itemKey={itemKey}>
      {children}
    </TeleportedCell>
  ) : null;
}

type TeleportedCellProps = {
  itemKey: string;
  isActive: SharedValue<boolean>;
  activationAnimationProgress: SharedValue<number>;
} & ActiveItemPortalProps;

function TeleportedCell({
  activationAnimationProgress,
  cellStyle,
  children,
  decorationStyle,
  isActive,
  itemKey
}: TeleportedCellProps) {
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
        <CellComponent
          cellStyle={[cellStyle, teleportedItemStyles]}
          decorationStyle={decorationStyle}
          handleItemMeasurement={handleItemMeasurement}
          itemKey={itemKey}
          itemsOverridesStyle={itemsOverridesStyle}>
          {children}
        </CellComponent>
      </LayoutAnimationConfig>
    );

    return () => teleport(itemKey, null);
  }, [
    cellStyle,
    itemKey,
    teleport,
    teleportedItemStyles,
    decorationStyle,
    handleItemMeasurement,
    itemsOverridesStyle,
    children
  ]);

  return null;
}
