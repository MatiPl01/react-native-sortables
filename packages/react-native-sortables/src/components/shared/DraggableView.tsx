import { memo, PropsWithChildren, useEffect } from 'react';
import type { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  LayoutAnimationConfig,
  measure,
  SharedValue,
  useAnimatedStyle,
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
import type {
  Dimensions,
  LayoutAnimation,
  LayoutTransition,
  Vector
} from '../../types';
import { SortableHandleInternal } from './SortableHandle';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';
import MaybeActiveItemPortal from './MaybeActiveItemPortal';

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
  const {
    activeItemKey,
    customHandle,
    activeItemDimensions,
    containerRef,
    activeItemPosition
  } = useCommonValuesContext();
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

  const itemComponent = (
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

  const maybeTeleportedComponent = (
    <MaybeActiveItemPortal
      activationProgress={activationAnimationProgress}
      itemKey={key}
      renderTeleportedComponent={() => (
        <TeleportedComponent
          activeItemDimensions={activeItemDimensions}
          activationAnimationProgress={activationAnimationProgress}
          activeItemPosition={activeItemPosition}
          containerRef={containerRef}
          decorationStyles={decorationStyles}
          layoutStyles={layoutStyles}>
          {children}
        </TeleportedComponent>
      )}>
      {itemComponent}
    </MaybeActiveItemPortal>
  );

  return (
    <ItemContextProvider
      activationAnimationProgress={activationAnimationProgress}
      isActive={isActive}
      itemKey={key}>
      {customHandle ? (
        maybeTeleportedComponent
      ) : (
        <SortableHandleInternal>
          {maybeTeleportedComponent}
        </SortableHandleInternal>
      )}
    </ItemContextProvider>
  );
}

type TeleportedComponentProps = PropsWithChildren<{
  activeItemDimensions: SharedValue<Dimensions | null>;
  activationAnimationProgress: SharedValue<number>;
  decorationStyles: StyleProp<AnimatedStyle<ViewStyle>>;
  containerRef: AnimatedRef<View>;
  activeItemPosition: SharedValue<Vector | null>;
  layoutStyles: StyleProp<AnimatedStyle<ViewStyle>>;
}>;

function TeleportedComponent({
  children,
  activeItemDimensions,
  activationAnimationProgress,
  decorationStyles,
  containerRef,
  layoutStyles,
  activeItemPosition
}: TeleportedComponentProps) {
  const { portalOutletRef } = usePortalContext()!;

  const animatedStyle = useAnimatedStyle(() => {
    const position = activeItemPosition.value;
    const dimensions = activeItemDimensions.value;

    const containerMeasurements = measure(containerRef);
    const portalOutletMeasurements = measure(portalOutletRef);

    if (
      !position ||
      !dimensions ||
      !containerMeasurements ||
      !portalOutletMeasurements
    ) {
      return { display: 'none' };
    }

    return {
      display: 'flex',
      opacity: activationAnimationProgress.value,
      transform: [
        {
          translateX:
            containerMeasurements.pageX - portalOutletMeasurements.pageX
        },
        {
          translateY:
            containerMeasurements.pageY - portalOutletMeasurements.pageY
        }
      ]
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={layoutStyles}>
        <Animated.View style={decorationStyles}>
          <LayoutAnimationConfig skipEntering skipExiting>
            {children}
          </LayoutAnimationConfig>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

export default memo(DraggableView);
