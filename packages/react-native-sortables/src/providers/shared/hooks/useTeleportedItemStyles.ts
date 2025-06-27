import { type StyleProp, type ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import { useAnimatedStyle } from 'react-native-reanimated';

import { mergeStyles } from '../../../utils';
import { usePortalContext } from '../PortalProvider';
import useItemDecorationValues from './useItemDecorationValues';
import useItemZIndex from './useItemZIndex';
import useTeleportedItemPosition from './useTeleportedItemPosition';

export default function useTeleportedItemStyles(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): StyleProp<AnimatedStyle<ViewStyle>> {
  const { portalOutletMeasurements } = usePortalContext() ?? {};

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const position = useTeleportedItemPosition(
    key,
    isActive,
    activationAnimationProgress
  );
  const decoration = useItemDecorationValues(
    key,
    isActive,
    activationAnimationProgress
  );

  return useAnimatedStyle(() => {
    console.log('useTeleportedItemStyles', {
      portalOutletMeasurements: portalOutletMeasurements?.value,
      position: position.value
    });
    if (!portalOutletMeasurements?.value || !position.value) {
      // This should never happen
      return { display: 'none' };
    }

    const { pageX: outletX, pageY: outletY } = portalOutletMeasurements.value;
    const { x: itemX, y: itemY } = position.value;

    console.log('useTeleportedItemStyles', {
      itemX,
      itemY,
      outletX,
      outletY
    });

    return mergeStyles(
      {
        display: 'flex',
        position: 'absolute',
        transform: [
          { translateX: itemX - outletX },
          { translateY: itemY - outletY }
        ],
        zIndex: zIndex.value
      },
      decoration.value
    );
  });
}
