import { View, type ViewProps } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';

import { useStableCallbackValues } from '../../integrations/reanimated';
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

  const handlers = useStableCallbackValues({
    onItemDrop,
    onItemEnter,
    onItemLeave
  });

  useZoneHandlers(containerRef, minActivationDistance, handlers);

  return <View ref={containerRef} {...rest} />;
}
