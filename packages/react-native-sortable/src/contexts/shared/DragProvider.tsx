import { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import { useAnimatableValue } from '../../hooks';
import type {
  ActiveItemDecorationSettings,
  AnimatedValues,
  Position
} from '../../types';
import { createEnhancedContext } from '../utils';

type DragContextType = {
  enabled: boolean;
  activeItemKey: SharedValue<null | string>;
  touchedItemKey: SharedValue<null | string>;
  activationProgress: SharedValue<number>;
  activeItemPosition: SharedValue<Position>;
  activeItemDropped: SharedValue<boolean>;
} & AnimatedValues<ActiveItemDecorationSettings>;

type DragProviderProps = PropsWithChildren<
  {
    enabled: boolean;
  } & ActiveItemDecorationSettings
>;

const { DragProvider, useDragContext } = createEnhancedContext('Drag')<
  DragContextType,
  DragProviderProps
>(({
  activeItemOpacity: activeItemOpacityProp,
  activeItemScale: activeItemScaleProp,
  activeItemShadowOpacity: activeItemShadowOpacityProp,
  children,
  enabled,
  inactiveItemOpacity: inactiveItemOpacityProp,
  inactiveItemScale: inactiveItemScaleProp
}) => {
  const activeItemScale = useAnimatableValue(activeItemScaleProp);
  const activeItemOpacity = useAnimatableValue(activeItemOpacityProp);
  const activeItemShadowOpacity = useAnimatableValue(
    activeItemShadowOpacityProp
  );
  const inactiveItemScale = useAnimatableValue(inactiveItemScaleProp);
  const inactiveItemOpacity = useAnimatableValue(inactiveItemOpacityProp);

  const activeItemKey = useSharedValue<null | string>(null);
  const touchedItemKey = useSharedValue<null | string>(null);
  const activationProgress = useSharedValue(0);
  const activeItemPosition = useSharedValue<Position>({ x: 0, y: 0 });
  const activeItemDropped = useSharedValue(true);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    zIndex: activationProgress.value > 0 ? 1 : 0
  }));

  return {
    children: (
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        {children}
      </Animated.View>
    ),
    value: {
      activationProgress,
      activeItemDropped,
      activeItemKey,
      activeItemOpacity,
      activeItemPosition,
      activeItemScale,
      activeItemShadowOpacity,
      enabled,
      inactiveItemOpacity,
      inactiveItemScale,
      touchedItemKey
    }
  };
});

const styles = StyleSheet.create({
  container: {
    width: '100%'
  }
});

export { DragProvider, useDragContext };
