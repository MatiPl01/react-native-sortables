import type { PropsWithChildren, ReactNode } from 'react';
import { Fragment, memo, useCallback, useEffect, useState } from 'react';
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
  CommonValuesContext,
  ItemContextProvider,
  useCommonValuesContext,
  useDragContext,
  useItemPanGesture,
  useItemStyles,
  useMeasurementsContext,
  usePortalContext
} from '../../../providers';
import { getContextProvider } from '../../../utils';
import ActiveItemPortal from './ActiveItemPortal';
import ItemCell from './ItemCell';
import TeleportedItemCell from './TeleportedItemCell';

const CommonValuesContextProvider = getContextProvider(CommonValuesContext);

export type DraggableViewProps = PropsWithChildren<{
  itemKey: string;
  entering: LayoutAnimation | undefined;
  exiting: LayoutAnimation | undefined;
  style?: AnimatedStyleProp;
}>;

function DraggableView({
  children,
  entering: entering_,
  exiting,
  itemKey: key,
  style
}: DraggableViewProps) {
  const portalContext = usePortalContext();
  const commonValuesContext = useCommonValuesContext();
  const { handleItemMeasurement, removeItemMeasurements } =
    useMeasurementsContext();
  const { handleDragEnd } = useDragContext();
  const { activeItemKey, containerId, customHandle } = commonValuesContext;

  const [{ entering, isTeleported }, setState] = useState<{
    entering?: LayoutAnimation;
    isTeleported: boolean;
  }>({ entering: entering_, isTeleported: false });
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

  useEffect(() => {
    if (!portalContext) {
      setState(prev => (prev.isTeleported ? { isTeleported: false } : prev));
      return;
    }

    const teleportedItemId = `${containerId}-${key}`;
    const unsubscribe = portalContext?.subscribe?.(
      teleportedItemId,
      teleported => setState({ isTeleported: teleported })
    );

    return () => {
      portalContext?.teleport?.(teleportedItemId, null);
      unsubscribe?.();
    };
  }, [portalContext, containerId, key]);

  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height, width }
      }
    }: LayoutChangeEvent) => handleItemMeasurement(key, { height, width }),
    [handleItemMeasurement, key]
  );

  const withItemContext = (component: ReactNode) => (
    <ItemContextProvider
      activationAnimationProgress={activationAnimationProgress}
      gesture={gesture}
      isActive={isActive}
      itemKey={key}>
      {component}
    </ItemContextProvider>
  );

  const sharedCellProps = {
    activationAnimationProgress,
    isActive,
    itemKey: key,
    onLayout
  };

  const renderItemCell = (hidden = false) => {
    const innerComponent = (
      <ItemCell
        {...sharedCellProps}
        cellStyle={[style, itemStyles]}
        entering={entering}
        exiting={exiting}
        hidden={hidden}>
        <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
          {children}
        </LayoutAnimationConfig>
      </ItemCell>
    );

    return withItemContext(
      customHandle ? (
        innerComponent
      ) : (
        <GestureDetector gesture={gesture} userSelect='none'>
          {innerComponent}
        </GestureDetector>
      )
    );
  };

  // NORMAL CASE (no portal)

  if (!portalContext) {
    return renderItemCell();
  }

  // PORTAL CASE

  const renderTeleportedItemCell = () => (
    // We have to wrap the TeleportedItemCell in context providers as they won't
    // be accessible otherwise, when the item is rendered in the portal outlet
    <CommonValuesContextProvider value={commonValuesContext}>
      {withItemContext(
        <TeleportedItemCell {...sharedCellProps} cellStyle={style}>
          {children}
        </TeleportedItemCell>
      )}
    </CommonValuesContextProvider>
  );

  return (
    <Fragment>
      {/* We cannot unmount this item as its gesture detector must be still
      mounted to continue handling the pan gesture */}
      {renderItemCell(isTeleported)}
      <ActiveItemPortal
        activationAnimationProgress={activationAnimationProgress}
        commonValuesContext={commonValuesContext}
        itemKey={key}
        renderTeleportedItemCell={renderTeleportedItemCell}>
        {children}
      </ActiveItemPortal>
    </Fragment>
  );
}

export default memo(DraggableView);
