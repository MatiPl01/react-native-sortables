import { Fragment, memo, useCallback, useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
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
  ItemOutlet,
  useCommonValuesContext,
  useDragContext,
  useItemLayout,
  useItemPanGesture,
  useItemsContext,
  useMeasurementsContext,
  usePortalContext
} from '../../../providers';
import SortableGestureDetector from '../SortableGestureDetector';
import ActiveItemPortal from './ActiveItemPortal';
import ItemCell from './ItemCell';

export type DraggableViewProps = {
  itemKey: string;
  itemEntering: LayoutAnimation | null;
  itemExiting: LayoutAnimation | null;
  style?: AnimatedStyleProp;
};

function DraggableView({
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
  const { getNode } = useItemsContext();
  const { activeItemKey, customHandle } = commonValuesContext;

  const [isHidden, setIsHidden] = useState(false);
  const activationAnimationProgress = useMutableValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const layoutStyleValue = useItemLayout(
    key,
    isActive,
    activationAnimationProgress
  );
  const gesture = useItemPanGesture(key, activationAnimationProgress);

  useEffect(() => {
    return () => {
      // This cleanup also runs when the item is only hidden (e.g. by Activity).
      // The item doesn't report its layout again when it is shown, so the
      // measurements are removed only if it is no longer rendered.
      if (getNode(key) === undefined) {
        removeItemMeasurements(key);
      }
      runOnUI(() => {
        handleDragEnd(key, activationAnimationProgress);
      })();
    };
  }, [
    activationAnimationProgress,
    getNode,
    handleDragEnd,
    key,
    removeItemMeasurements
  ]);

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
        baseStyle={style}
        entering={itemEntering ?? undefined}
        exiting={itemExiting ?? undefined}
        hidden={hidden}
        isActive={isActive}
        itemKey={key}
        layoutStyleValue={layoutStyleValue}
        onLayout={onLayout}>
        <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
          <ItemOutlet itemKey={key} />
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
          <SortableGestureDetector gesture={gesture}>
            {innerComponent}
          </SortableGestureDetector>
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
    <Fragment>
      {/* We cannot unmount this item as its gesture detector must be still
      mounted to continue handling the pan gesture */}
      {renderItemCell(isHidden)}
      <ActiveItemPortal
        activationAnimationProgress={activationAnimationProgress}
        baseStyle={style}
        commonValuesContext={commonValuesContext}
        gesture={gesture}
        isActive={isActive}
        itemKey={key}
        onTeleport={setIsHidden}
      />
    </Fragment>
  );
}

export default memo(DraggableView);
