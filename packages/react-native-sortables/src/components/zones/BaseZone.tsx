import { View, type ViewProps } from 'react-native';

export type CallbacksZoneProps = ViewProps & {
  onItemEnter: () => void;
  onItemLeave: () => void;
  onItemDrop: () => void;
  minActivationDistance?: number;
};

export default function CallbackZone({
  minActivationDistance = 0,
  onItemDrop,
  onItemEnter,
  onItemLeave,
  ...rest
}: CallbacksZoneProps) {
  return <View {...rest} />;
}
