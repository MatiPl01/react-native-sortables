import { memo, useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  LayoutAnimationConfig,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import {
  ItemContextProvider,
  useCommonValuesContext,
  useItemLayoutStyles,
  useMeasurementsContext
} from '../../providers';
import type { LayoutAnimation, LayoutTransition } from '../../types';
import ItemDecoration from './ItemDecoration';
import { SortableHandleInternal } from './SortableHandle';

export type DraggableViewProps = {
  itemKey: string;
  entering: LayoutAnimation | undefined;
  exiting: LayoutAnimation | undefined;
  layout: LayoutTransition | undefined;
} & ViewProps;

function DraggableView({
  children,
  entering,
  exiting,
  itemKey: key,
  layout,
  style,
  ...viewProps
}: DraggableViewProps) {
  const { activeItemKey, customHandle, itemsOverridesStyle } =
    useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const activationAnimationProgress = useSharedValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const layoutStyles = useItemLayoutStyles(key, activationAnimationProgress);

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const innerComponent = (
    <ItemDecoration
      activationAnimationProgress={activationAnimationProgress}
      isActive={isActive}
      itemKey={key}
      // Keep onLayout the closest to the children to measure the real item size
      // (without paddings or other style changes made to the wrapper component)
      onLayout={({
        nativeEvent: {
          layout: { height, width }
        }
      }) => {
        handleItemMeasurement(key, {
          height,
          width
        });
      }}>
      <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
        {children}
      </LayoutAnimationConfig>
    </ItemDecoration>
  );

  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : layout}
      style={[style, itemsOverridesStyle, layoutStyles]}>
      <ItemContextProvider
        activationAnimationProgress={activationAnimationProgress}
        isActive={isActive}
        itemKey={key}>
        <Animated.View entering={entering} exiting={exiting}>
          {customHandle ? (
            innerComponent
          ) : (
            <SortableHandleInternal>{innerComponent}</SortableHandleInternal>
          )}
        </Animated.View>
      </ItemContextProvider>
    </Animated.View>
  );
}

export default memo(DraggableView);
