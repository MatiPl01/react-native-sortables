import type { PropsWithChildren, ReactNode } from 'react';
import { memo, useEffect } from 'react';
import {
  LayoutAnimationConfig,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { IS_REACT_19 } from '../../../constants';
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
  LayoutTransition
} from '../../../types';
import { SortableHandleInternal } from '../SortableHandle';
import ActiveItemPortal from './ActiveItemPortal';
import ItemCell from './ItemCell';
import TeleportedItemCell from './TeleportedItemCell';

export type DraggableViewProps = PropsWithChildren<{
  itemKey: string;
  entering: LayoutAnimation | undefined;
  exiting: LayoutAnimation | undefined;
  layout: LayoutTransition | undefined;
  style: AnimatedStyleProp;
}>;

function DraggableView({
  children,
  itemKey: key,
  style,
  ...layoutAnimations
}: DraggableViewProps) {
  const hasPortal = !!usePortalContext();
  const commonValuesContext = useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();
  const { activeItemKey, customHandle, itemsOverridesStyle } =
    commonValuesContext;

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

  const sharedCellProps = {
    decorationStyle,
    handleItemMeasurement,
    itemKey: key,
    itemsOverridesStyle
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

  const renderItemCell = (cellChildren: ReactNode) => {
    console.log('>>>> renderItemCell', key, !!cellChildren);

    return (
      <ItemCell
        {...layoutAnimations}
        {...sharedCellProps}
        cellStyle={[style, layoutStyles]}>
        {cellChildren && (
          <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
            {cellChildren}
          </LayoutAnimationConfig>
        )}
      </ItemCell>
    );
  };

  // NORMAL CASE (no portal)

  if (!hasPortal) {
    return wrapComponent(renderItemCell(children));
  }

  // PORTAL CASE

  const renderTeleportedItemCell = (cellChildren: ReactNode) => {
    const CommonValuesContextProvider = IS_REACT_19
      ? CommonValuesContext
      : CommonValuesContext.Provider;

    return (
      // We have to wrap the TeleportedItemCell in a CommonValuesContext provider
      // as it won't be accessible otherwise, when the item is rendered in the
      // portal outlet
      <CommonValuesContextProvider value={commonValuesContext}>
        <TeleportedItemCell
          {...sharedCellProps}
          activationAnimationProgress={activationAnimationProgress}
          baseCellStyle={style}
          isActive={isActive}>
          {cellChildren}
        </TeleportedItemCell>
      </CommonValuesContextProvider>
    );
  };

  return wrapComponent(
    <ActiveItemPortal
      activationAnimationProgress={activationAnimationProgress}
      itemKey={key}
      renderItemCell={renderItemCell}
      renderTeleportedItemCell={renderTeleportedItemCell}>
      {children}
    </ActiveItemPortal>
  );
}

export default memo(DraggableView);
