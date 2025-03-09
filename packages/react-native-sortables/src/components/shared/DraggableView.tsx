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
  useMeasurementsContext,
  usePortalContext
} from '../../providers';
import type { LayoutAnimation, LayoutTransition } from '../../types';
import ActiveItemPortal from './ActiveItemPortal';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';
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
  const hasPortal = !!usePortalContext();
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
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : layout}
      style={[style, layoutStyles]}>
      <AnimatedOnLayoutView
        entering={entering}
        exiting={exiting}
        style={decorationStyles}
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
    </Animated.View>
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
        <ActiveItemPortal
          activationAnimationProgress={activationAnimationProgress}>
          {/* TODO - fix grid style */}
          <Animated.View style={decorationStyles}>{children}</Animated.View>
        </ActiveItemPortal>
      )}
    </ItemContextProvider>
  );
}

export default memo(DraggableView);
