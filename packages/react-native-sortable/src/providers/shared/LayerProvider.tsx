import { type PropsWithChildren, useCallback } from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import type { LayerProviderContextType, LayerState } from '../../types';
import { createProvider } from '../utils';

type LayerProviderProps = PropsWithChildren<
  ViewProps & {
    disabled?: boolean;
  }
>;

const { LayerProvider, useLayerContext } = createProvider('Layer', {
  guarded: false
})<LayerProviderProps, LayerProviderContextType>(({
  children,
  disabled,
  ...viewProps
}) => {
  const { updateLayer: updateParentLayer } = (useLayerContext() ??
    {}) as Partial<LayerProviderContextType>;

  const zIndex = useSharedValue(0);

  const updateLayer = useCallback(
    (state: LayerState) => {
      'worklet';
      zIndex.value = state;
      updateParentLayer?.(state);
    },
    [zIndex, updateParentLayer]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: disabled ? 0 : zIndex.value
  }));

  return {
    children: (
      <Animated.View
        {...viewProps}
        style={[styles.container, viewProps.style, animatedStyle]}>
        {children}
      </Animated.View>
    ),
    value: {
      updateLayer
    }
  };
});

const styles = StyleSheet.create({
  container: {
    width: '100%'
  }
});

export { LayerProvider, useLayerContext };
