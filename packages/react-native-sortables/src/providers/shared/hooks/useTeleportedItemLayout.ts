import { type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import { usePortalContext } from '../PortalProvider';
import useItemZIndex from './useItemZIndex';
import useTeleportedItemPosition from './useTeleportedItemPosition';

export default function useTeleportedItemLayout(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): SharedValue<ViewStyle> {
  const { portalOutletMeasurements } = usePortalContext() ?? {};

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const position = useTeleportedItemPosition(
    key,
    isActive,
    activationAnimationProgress
  );

  return useDerivedValue<ViewStyle>(() => {
    if (!portalOutletMeasurements?.value || !position.value) {
      // This should never happen
      return { display: 'none' };
    }

    const { pageX: outletX, pageY: outletY } = portalOutletMeasurements.value;
    const { x: itemX, y: itemY } = position.value;

    return {
      display: 'flex',
      position: 'absolute',
      transform: [
        { translateX: itemX - outletX },
        { translateY: itemY - outletY }
      ],
      zIndex: zIndex.value
    };
  });
}
