import { type PropsWithChildren } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useSharedValue } from 'react-native-reanimated';

import { useAnimatableValue } from '../../../hooks';
import type {
  ActiveItemDecorationSettings,
  AnimatedValues,
  Position
} from '../../../types';
import { createEnhancedContext } from '../../utils';

type DragContextType = {
  enabled: boolean;
  activeItemKey: SharedValue<null | string>;
  touchedItemKey: SharedValue<null | string>;
  activationProgress: SharedValue<number>;
  activeItemPosition: SharedValue<Position>;
  activeItemDropped: SharedValue<boolean>;
  dragStartPosition: SharedValue<Position>;
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
  const dragStartPosition = useSharedValue({ x: 0, y: 0 });
  const activeItemDropped = useSharedValue(true);

  return {
    value: {
      activationProgress,
      activeItemDropped,
      activeItemKey,
      activeItemOpacity,
      activeItemPosition,
      activeItemScale,
      activeItemShadowOpacity,
      dragStartPosition,
      enabled,
      inactiveItemOpacity,
      inactiveItemScale,
      touchedItemKey
    }
  };
});

export { DragProvider, useDragContext };
