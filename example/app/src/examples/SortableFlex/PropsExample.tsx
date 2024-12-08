import { View } from 'react-native';
import Sortable from 'react-native-sortable';

const Component = Sortable.Flex;

export default function PropsExample() {
  return (
    <Component
      style={{
        backgroundColor: 'red',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        height: 200,
        justifyContent: 'space-between',
        padding: 20
      }}>
      <View
        style={{
          backgroundColor: 'blue',
          height: 50,
          width: 75
        }}
      />
      <View style={{ backgroundColor: 'blue', height: 75, width: 100 }} />
      <View style={{ backgroundColor: 'blue', minHeight: 50, width: 100 }} />
      <View style={{ backgroundColor: 'blue', height: 50, width: 100 }} />
      <View style={{ backgroundColor: 'blue', height: 50, width: 100 }} />
    </Component>
  );
}
