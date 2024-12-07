import { View } from 'react-native';
import Sortable from 'react-native-sortable';

const Component = Sortable.Flex;

export default function PropsExample() {
  return (
    <Component
      style={{
        backgroundColor: 'red',
        gap: 20,
        height: 200,
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }}>
      <View
        style={{
          height: 50,
          width: 75,
          backgroundColor: 'blue'
        }}
      />
      <View style={{ height: 75, width: 100, backgroundColor: 'blue' }} />
      <View style={{ height: 50, width: 100, backgroundColor: 'blue' }} />
      <View style={{ height: 50, width: 100, backgroundColor: 'blue' }} />
      <View style={{ height: 50, width: 100, backgroundColor: 'blue' }} />
    </Component>
  );
}
