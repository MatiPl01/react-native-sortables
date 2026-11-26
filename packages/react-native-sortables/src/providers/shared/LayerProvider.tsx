import { type PropsWithChildren, useCallback } from 'react';
import type { ViewProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useMutableValue } from '../../integrations/reanimated';
import type { LayerContextType, LayerState } from '../../types';
import { createProvider } from '../utils';

type LayerProviderProps = PropsWithChildren<
  ViewProps & {
    disabled?: boolean;
  }
>;

const { LayerProvider, useLayerContext } = createProvider('Layer', {
  guarded: false
})<LayerProviderProps, LayerContextType>(({
  children,
  disabled,
  style,
  ...viewProps
}) => {
  const { updateLayer: updateParentLayer } = (useLayerContext() ??
    {}) as Partial<LayerContextType>;

  const zIndex = useMutableValue(0);

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
      <Animated.View {...viewProps} style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    ),
    value: {
      updateLayer
    }
  };
});

export { LayerProvider, useLayerContext };
