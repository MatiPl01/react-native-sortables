import { memo, useEffect } from 'react';
import type { ViewProps } from 'react-native';
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
import { CellComponent } from './CellComponent';

export type DraggableViewProps = {
  itemKey: string;
  entering: LayoutAnimation | undefined;
  exiting: LayoutAnimation | undefined;
  layout: LayoutTransition | undefined;
} & ViewProps;

function DraggableView({
  children,
  itemKey: key,
  style,
  ...cellProps
}: DraggableViewProps) {
  const hasPortal = !!usePortalContext();
  const { activeItemKey, customHandle, itemsOverridesStyle } =
    useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const activationAnimationProgress = useSharedValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const layoutStyles = useItemLayoutStyles(key, activationAnimationProgress);
  const decorationStyles = useItemDecorationStyles(
    key,
    isActive,
    activationAnimationProgress
  );

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const innerComponent = (
    <CellComponent
      {...cellProps}
      cellStyle={[style, layoutStyles]}
      decorationStyle={decorationStyles}
      handleItemMeasurement={handleItemMeasurement}
      itemKey={key}
      itemsOverridesStyle={itemsOverridesStyle}>
      <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
        {children}
      </LayoutAnimationConfig>
    </CellComponent>
  );

  return (
    <ItemContextProvider
      activationAnimationProgress={activationAnimationProgress}
      isActive={isActive}
      itemKey={key}>
      {customHandle ? (
        innerComponent
      ) : (
        <SortableHandleInternal>{innerComponent}</SortableHandleInternal>
      )}
      {hasPortal && (
        <ActiveItemPortal cellStyle={style} decorationStyle={decorationStyles}>
          {children}
        </ActiveItemPortal>
      )}
    </ItemContextProvider>
  );
}

export default memo(DraggableView);
