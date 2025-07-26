import type { PropsWithChildren, ReactNode } from 'react';
import { Fragment, memo, useEffect, useState } from 'react';
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
  itemKey: key,
  style,
  ...layoutAnimations
}: DraggableViewProps) {
  const portalContext = usePortalContext();
  const commonValuesContext = useCommonValuesContext();
  const { handleItemMeasurement, removeItemMeasurements } =
    useMeasurementsContext();
  const { handleDragEnd } = useDragContext();
  const { activeItemKey, containerId, customHandle } = commonValuesContext;

  const [isTeleported, setIsTeleported] = useState(false);
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
      setIsTeleported(false);
      return;
    }

    const teleportedItemId = `${containerId}-${key}`;
    const unsubscribe = portalContext?.subscribe?.(
      teleportedItemId,
      setIsTeleported
    );

    return () => {
      portalContext?.teleport?.(teleportedItemId, null);
      unsubscribe?.();
    };
  }, [portalContext, containerId, key]);

  const onMeasure = (width: number, height: number) =>
    handleItemMeasurement(key, { height, width });

  const withItemContext = (component: ReactNode) => (
    <ItemContextProvider
      activationAnimationProgress={activationAnimationProgress}
      gesture={gesture}
      isActive={isActive}
      itemKey={key}>
      {component}
    </ItemContextProvider>
  );

  const renderItemCell = (hidden = false) => {
    const innerComponent = (
      <ItemCell
        {...layoutAnimations}
        cellStyle={[style, itemStyles]}
        hidden={hidden}
        onMeasure={onMeasure}>
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
        <TeleportedItemCell
          activationAnimationProgress={activationAnimationProgress}
          baseCellStyle={style}
          isActive={isActive}
          itemKey={key}
          onMeasure={onMeasure}>
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
