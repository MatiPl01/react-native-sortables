import { type PropsWithChildren } from 'react';
import {
  type SharedValue,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import type {
  ActiveItemDecorationSettings,
  Position,
  Sharedify
} from '../../types';
import { createGuardedContext } from '../utils';

type DragContextType = {
  enabled: boolean;
  activeItemKey: SharedValue<null | string>;
  activationProgress: SharedValue<number>;
  activeItemPosition: SharedValue<Position>;
  activeItemDropped: SharedValue<boolean>;
} & Sharedify<ActiveItemDecorationSettings>;

type DragProviderProps = PropsWithChildren<
  {
    enabled: boolean;
  } & ActiveItemDecorationSettings
>;

const { DragProvider, useDragContext } = createGuardedContext('Drag')<
  DragContextType,
  DragProviderProps
>(({
  activeItemOpacity: activeItemOpacityProp = 1,
  activeItemScale: activeItemScaleProp = 1.1,
  activeItemShadowOpacity: activeItemShadowOpacityProp = 0.15,
  enabled,
  inactiveItemOpacity: inactiveItemOpacityProp = 0.5,
  inactiveItemScale: inactiveItemScaleProp = 1
}) => {
  const activeItemScale = useDerivedValue(() => activeItemScaleProp);
  const activeItemOpacity = useDerivedValue(() => activeItemOpacityProp);
  const activeItemShadowOpacity = useDerivedValue(
    () => activeItemShadowOpacityProp
  );
  const inactiveItemScale = useDerivedValue(() => inactiveItemScaleProp);
  const inactiveItemOpacity = useDerivedValue(() => inactiveItemOpacityProp);

  const activeItemKey = useSharedValue<null | string>(null);
  const activationProgress = useSharedValue(0);
  const activeItemPosition = useSharedValue<Position>({ x: 0, y: 0 });
  const activeItemDropped = useSharedValue(false);

  return {
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
      inactiveItemScale
    }
  };
});

export { DragProvider, useDragContext };
