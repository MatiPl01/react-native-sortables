import type { PropsWithChildren, ReactNode } from 'react';
import { memo, useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import {
  LayoutAnimationConfig,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import {
  ItemContextProvider,
  useCommonValuesContext,
  useItemDecorationStyles,
  useItemLayoutStyles,
  useMeasurementsContext,
  usePortalContext
} from '../../../providers';
import type { LayoutAnimation, LayoutTransition } from '../../../types';
import { SortableHandleInternal } from '../SortableHandle';
import ActiveItemPortal from './ActiveItemPortal';
import ItemCell from './ItemCell';
import TeleportedItemCell from './TeleportedItemCell';

export type DraggableViewProps = PropsWithChildren<{
  itemKey: string;
  entering: LayoutAnimation | undefined;
  exiting: LayoutAnimation | undefined;
  layout: LayoutTransition | undefined;
  style: StyleProp<AnimatedStyle<ViewStyle>>; // TODO: add helper type
}>;

function DraggableView({
  children,
  itemKey: key,
  style,
  ...layoutAnimations
}: DraggableViewProps) {
  const hasPortal = !!usePortalContext();
  const { activeItemKey, customHandle, itemsOverridesStyle } =
    useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const activationAnimationProgress = useSharedValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const layoutStyles = useItemLayoutStyles(key, activationAnimationProgress);
  const decorationStyle = useItemDecorationStyles(
    key,
    isActive,
    activationAnimationProgress
  );

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const wrapComponent = (innerComponent: ReactNode) => (
    <ItemContextProvider
      activationAnimationProgress={activationAnimationProgress}
      isActive={isActive}
      itemKey={key}>
      {customHandle ? (
        innerComponent
      ) : (
        <SortableHandleInternal>{innerComponent}</SortableHandleInternal>
      )}
    </ItemContextProvider>
  );

  const renderItemCell = () => (
    <ItemCell
      {...layoutAnimations}
      cellStyle={[style, layoutStyles]}
      decorationStyle={decorationStyle}
      handleItemMeasurement={handleItemMeasurement}
      itemKey={key}
      itemsOverridesStyle={itemsOverridesStyle}>
      <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
        {children}
      </LayoutAnimationConfig>
    </ItemCell>
  );

  if (!hasPortal) {
    return wrapComponent(renderItemCell());
  }

  const renderPlaceholderCell = () => (
    <ItemCell cellStyle={[style, layoutStyles]} itemKey={key} />
  );

  const renderTeleportedItemCell = (onRender: () => void) => (
    <TeleportedItemCell
      activationAnimationProgress={activationAnimationProgress}
      baseCellStyle={style}
      decorationStyle={decorationStyle}
      isActive={isActive}
      itemKey={key}
      onRender={onRender}>
      <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
        {children}
      </LayoutAnimationConfig>
    </TeleportedItemCell>
  );

  return wrapComponent(
    <ActiveItemPortal
      activationAnimationProgress={activationAnimationProgress}
      renderItemCell={renderItemCell}
      renderPlaceholderCell={renderPlaceholderCell}
      renderTeleportedItemCell={renderTeleportedItemCell}
    />
  );
}

export default memo(DraggableView);
