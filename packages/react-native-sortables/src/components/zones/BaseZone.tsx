import { View, type ViewProps } from 'react-native';

export type BaseZoneProps = ViewProps & {
  onItemEnter?: () => void;
  onItemLeave?: () => void;
  onItemDrop?: () => void;
  minActivationDistance?: number;
};

export default function BaseZone({
  minActivationDistance = 0,
  onItemDrop,
  onItemEnter,
  onItemLeave,
  ...rest
}: BaseZoneProps) {
  return <View {...rest} />;
}
