import { type PropsWithChildren, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';

import { createEnhancedContext } from '../../utils';

export enum LayerState {
  Focused = 2,
  Idle = 0,
  Intermediate = 1
}

type LayerProviderContextType = {
  updateLayer: (state: LayerState) => void;
};

type LayerProviderProps = PropsWithChildren<{
  disabled?: boolean;
}>;

const { LayerProvider, useLayerContext } = createEnhancedContext(
  'Layer',
  false
)<LayerProviderContextType, LayerProviderProps>(({ children, disabled }) => {
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

  return {
    children: (
      <Animated.View
        style={[styles.container, { zIndex: disabled ? 0 : zIndex }]}>
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
