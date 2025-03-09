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
  useItemDecorationStyles,
  useItemLayoutStyles,
  useMeasurementsContext
} from '../../providers';
import type { LayoutAnimation, LayoutTransition } from '../../types';
import { SortableHandleInternal } from './SortableHandle';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';

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
  const { activeItemKey, customHandle } = useCommonValuesContext();
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
    <AnimatedOnLayoutView
      style={decorationStyles}
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
    </AnimatedOnLayoutView>
  );

  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : layout}
      style={[style, layoutStyles]}>
      <Animated.View entering={entering} exiting={exiting}>
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
      </Animated.View>
    </Animated.View>
  );
}

export default memo(DraggableView);
