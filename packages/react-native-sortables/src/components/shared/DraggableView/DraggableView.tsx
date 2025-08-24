import type { PropsWithChildren } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  LayoutAnimationConfig,
  runOnUI,
  useDerivedValue
} from 'react-native-reanimated';

import type {
  AnimatedStyleProp,
  LayoutAnimation
} from '../../../integrations/reanimated';
import { useMutableValue } from '../../../integrations/reanimated';
import {
  ItemContextProvider,
  useCommonValuesContext,
  useDragContext,
  useItemPanGesture,
  useItemStyles,
  useMeasurementsContext,
  usePortalContext
} from '../../../providers';
import ActiveItemPortal from './ActiveItemPortal';
import ItemCell from './ItemCell';

export type DraggableViewProps = PropsWithChildren<{
  itemKey: string;
  itemEntering: LayoutAnimation | null;
  itemExiting: LayoutAnimation | null;
  style?: AnimatedStyleProp;
}>;

function DraggableView({
  children,
  itemEntering,
  itemExiting,
  itemKey: key,
  style
}: DraggableViewProps) {
  const portalContext = usePortalContext();
  const commonValuesContext = useCommonValuesContext();
  const { handleItemMeasurement, removeItemMeasurements } =
    useMeasurementsContext();
  const { handleDragEnd } = useDragContext();
  const { activeItemKey, customHandle } = commonValuesContext;

  const [isHidden, setIsHidden] = useState(false);
  const activationAnimationProgress = useMutableValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const itemStyles = useItemStyles(key, isActive, activationAnimationProgress);
  const gesture = useItemPanGesture(key, activationAnimationProgress);

  useEffect(() => {
    return () => {
      removeItemMeasurements(key);
      runOnUI(() => {
        handleDragEnd(key, activationAnimationProgress);
      })();
    };
  }, [activationAnimationProgress, handleDragEnd, key, removeItemMeasurements]);

  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height, width }
      }
    }: LayoutChangeEvent) => handleItemMeasurement(key, { height, width }),
    [handleItemMeasurement, key]
  );

  const renderItemCell = (hidden = false) => {
    const innerComponent = (
      <ItemCell
        activationAnimationProgress={activationAnimationProgress}
        cellStyle={[style, itemStyles]}
        entering={itemEntering ?? undefined}
        exiting={itemExiting ?? undefined}
        hidden={hidden}
        isActive={isActive}
        itemKey={key}
        onLayout={onLayout}>
        <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
          {children}
        </LayoutAnimationConfig>
      </ItemCell>
    );

    return (
      <ItemContextProvider
        activationAnimationProgress={activationAnimationProgress}
        gesture={gesture}
        isActive={isActive}
        itemKey={key}>
        {customHandle ? (
          innerComponent
        ) : (
          <GestureDetector gesture={gesture} userSelect='none'>
            {innerComponent}
          </GestureDetector>
        )}
      </ItemContextProvider>
    );
  };

  // NORMAL CASE (no portal)

  if (!portalContext) {
    return renderItemCell();
  }

  // PORTAL CASE

  return (
    <>
      {/* We cannot unmount this item as its gesture detector must be still
      mounted to continue handling the pan gesture */}
      {renderItemCell(isHidden)}
      <ActiveItemPortal
        activationAnimationProgress={activationAnimationProgress}
        cellStyle={style}
        commonValuesContext={commonValuesContext}
        gesture={gesture}
        isActive={isActive}
        itemKey={key}
        onTeleport={setIsHidden}>
        {children}
      </ActiveItemPortal>
    </>
  );
}

export default memo(DraggableView);
