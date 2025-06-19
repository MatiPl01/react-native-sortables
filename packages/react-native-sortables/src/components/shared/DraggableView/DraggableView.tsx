import type { PropsWithChildren, ReactNode } from 'react';
import { Fragment, memo, useEffect } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
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
  useItemPanGesture,
  useMeasurementsContext,
  usePortalContext
} from '../../../providers';
import {
  type AnimatedStyleProp,
  ItemPortalState,
  type LayoutAnimation
} from '../../../types';
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
  const { handleItemMeasurement, removeItemMeasurements } =
    useMeasurementsContext();
  const commonValuesContext = useCommonValuesContext();
  const { activeItemKey, componentId, customHandle, itemsOverridesStyle } =
    commonValuesContext;

  const activationAnimationProgress = useSharedValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const portalState = useSharedValue(ItemPortalState.IDLE);
  const layoutStyles = useItemLayoutStyles(key, activationAnimationProgress);
  const decorationStyles = useItemDecorationStyles(
    key,
    isActive,
    activationAnimationProgress,
    portalState
  );
  const gesture = useItemPanGesture(key, activationAnimationProgress);

  useEffect(() => {
    return () => removeItemMeasurements(key);
  }, [key, removeItemMeasurements]);

  const withItemContext = (component: ReactNode) => (
    <ItemContextProvider
      activationAnimationProgress={activationAnimationProgress}
      gesture={gesture}
      isActive={isActive}
      itemKey={key}>
      {component}
    </ItemContextProvider>
  );

  const renderItemCell = () => {
    const innerComponent = (
      <ItemCell
        {...layoutAnimations}
        cellStyle={[style, layoutStyles]}
        decorationStyles={decorationStyles}
        itemsOverridesStyle={itemsOverridesStyle}
        onMeasure={(width, height) =>
          handleItemMeasurement(key, { height, width })
        }>
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

  const teleportedItemId = `${componentId}-${key}`;

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
          itemsOverridesStyle={itemsOverridesStyle}
          teleportedItemId={teleportedItemId}>
          {children}
        </TeleportedItemCell>
      )}
    </CommonValuesContextProvider>
  );

  return (
    <Fragment>
      {renderItemCell()}
      <ActiveItemPortal
        activationAnimationProgress={activationAnimationProgress}
        portalState={portalState}
        renderTeleportedItemCell={renderTeleportedItemCell}
        teleportedItemId={teleportedItemId}>
        {children}
      </ActiveItemPortal>
    </Fragment>
  );
}

export default memo(DraggableView);
