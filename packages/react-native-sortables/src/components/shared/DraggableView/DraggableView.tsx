import type { PropsWithChildren, ReactNode } from 'react';
import { memo, useEffect } from 'react';
import {
  LayoutAnimationConfig,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import {
  CommonValuesContext,
  ItemContextProvider,
  useCommonValuesContext,
  useItemDecorationStyles,
  useItemLayoutStyles,
  useMeasurementsContext,
  usePortalContext
} from '../../../providers';
import type {
  AnimatedStyleProp,
  LayoutAnimation,
  LayoutTransition,
  MeasureCallback
} from '../../../types';
import { getContextProvider } from '../../../utils';
import { SortableHandleInternal } from '../SortableHandle';
import ActiveItemPortal from './ActiveItemPortal';
import ItemCell from './ItemCell';
import TeleportedItemCell from './TeleportedItemCell';

const CommonValuesContextProvider = getContextProvider(CommonValuesContext);

export type DraggableViewProps = PropsWithChildren<{
  itemKey: string;
  entering: LayoutAnimation | undefined;
  exiting: LayoutAnimation | undefined;
  layout: LayoutTransition | undefined;
  style?: AnimatedStyleProp;
}>;

function DraggableView({
  children,
  itemKey: key,
  style,
  ...layoutAnimations
}: DraggableViewProps) {
  const hasPortal = !!usePortalContext();
  const commonValuesContext = useCommonValuesContext();
  const { handleItemMeasurement, removeItemMeasurements } =
    useMeasurementsContext();
  const { activeItemKey, customHandle, itemsOverridesStyle } =
    commonValuesContext;

  const activationAnimationProgress = useSharedValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const layoutStyles = useItemLayoutStyles(key, activationAnimationProgress);
  const decorationStyles = useItemDecorationStyles(
    key,
    isActive,
    activationAnimationProgress
  );

  useEffect(() => {
    return () => removeItemMeasurements(key);
  }, [key, removeItemMeasurements]);

  const sharedCellProps = {
    decorationStyles,
    handleItemMeasurement,
    itemKey: key,
    itemsOverridesStyle
  };

  const onMeasureItem = (width: number, height: number) => {
    'worklet';
    handleItemMeasurement(key, { height, width });
  };

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

  const renderItemCell = (
    onMeasure: MeasureCallback,
    itemStyle?: AnimatedStyleProp
  ) =>
    wrapComponent(
      <ItemCell
        {...layoutAnimations}
        {...sharedCellProps}
        cellStyle={[style, layoutStyles]}
        itemStyle={itemStyle}
        onMeasure={onMeasure}>
        <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
          {children}
        </LayoutAnimationConfig>
      </ItemCell>
    );

  // NORMAL CASE (no portal)

  if (!hasPortal) {
    return renderItemCell(onMeasureItem);
  }

  // PORTAL CASE

  const renderTeleportedItemCell = () => (
    // We have to wrap the TeleportedItemCell in a CommonValuesContext provider
    // as it won't be accessible otherwise, when the item is rendered in the
    // portal outlet
    <CommonValuesContextProvider value={commonValuesContext}>
      <TeleportedItemCell
        {...sharedCellProps}
        activationAnimationProgress={activationAnimationProgress}
        baseCellStyle={style}
        isActive={isActive}
        onMeasure={onMeasureItem}>
        {children}
      </TeleportedItemCell>
    </CommonValuesContextProvider>
  );

  return (
    <ActiveItemPortal
      activationAnimationProgress={activationAnimationProgress}
      itemKey={key}
      renderItemCell={renderItemCell}
      renderTeleportedItemCell={renderTeleportedItemCell}
      onMeasureItem={onMeasureItem}>
      {children}
    </ActiveItemPortal>
  );
}

export default memo(DraggableView);
