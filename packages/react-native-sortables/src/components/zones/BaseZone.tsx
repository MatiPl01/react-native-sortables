import { View, type ViewProps } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';

import { useStableCallbackValue } from '../../integrations/reanimated';
import type { ZoneHandlers } from '../../providers';
import { useZoneHandlers } from '../../providers';

export type BaseZoneProps = ViewProps &
  ZoneHandlers & {
    minActivationDistance?: number;
  };

export default function BaseZone({
  minActivationDistance = 0,
  onItemDrop,
  onItemEnter,
  onItemLeave,
  ...rest
}: BaseZoneProps) {
  const containerRef = useAnimatedRef<View>();

  const stableOnItemEnter = useStableCallbackValue(onItemEnter);
  const stableOnItemLeave = useStableCallbackValue(onItemLeave);
  const stableOnItemDrop = useStableCallbackValue(onItemDrop);

  useZoneHandlers(containerRef, minActivationDistance, {
    onItemDrop: stableOnItemDrop,
    onItemEnter: stableOnItemEnter,
    onItemLeave: stableOnItemLeave
  });

  return <View ref={containerRef} {...rest} />;
}
