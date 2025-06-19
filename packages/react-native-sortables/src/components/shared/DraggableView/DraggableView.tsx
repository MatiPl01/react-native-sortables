import type { PropsWithChildren, ReactNode } from 'react';
import { Fragment, memo, useEffect, useState } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
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
import type { AnimatedStyleProp, LayoutAnimation } from '../../../types';
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

  const teleportedItemId = `${componentId}-${key}`;

  const [isTeleported, setIsTeleported] = useState(false);
  const activationAnimationProgress = useSharedValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const layoutStyles = useItemLayoutStyles(key, activationAnimationProgress);
  const decorationStyles = useItemDecorationStyles(
    key,
    isActive,
    activationAnimationProgress
  );
  const gesture = useItemPanGesture(key, activationAnimationProgress);

  useEffect(() => {
    return () => {
      removeItemMeasurements(key);
    };
  }, [key, removeItemMeasurements, teleportedItemId]);

  const withItemContext = (component: ReactNode) => (
    <ItemContextProvider
      activationAnimationProgress={activationAnimationProgress}
      gesture={gesture}
      isActive={isActive}
      itemKey={key}>
      {component}
    </ItemContextProvider>
  );

  const renderItemCell = (styleOverride?: ViewStyle) => {
    const innerComponent = (
      <ItemCell
        {...layoutAnimations}
        cellStyle={[style, layoutStyles, styleOverride]}
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
          itemsOverridesStyle={itemsOverridesStyle}>
          {children}
        </TeleportedItemCell>
      )}
    </CommonValuesContextProvider>
  );

  return (
    <Fragment>
      {/* We cannot unmount this item as its gesture detector must be still
      mounted to continue handling the pan gesture */}
      {renderItemCell(isTeleported ? styles.hidden : undefined)}
      <ActiveItemPortal
        activationAnimationProgress={activationAnimationProgress}
        renderTeleportedItemCell={renderTeleportedItemCell}
        setIsTeleported={setIsTeleported}
        teleportedItemId={teleportedItemId}>
        {children}
      </ActiveItemPortal>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0
  }
});

export default memo(DraggableView);
