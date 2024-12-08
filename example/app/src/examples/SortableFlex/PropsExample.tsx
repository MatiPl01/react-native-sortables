import Animated from 'react-native-reanimated';
import Sortable from 'react-native-sortable';

const Component = Sortable.Flex;

export default function PropsExample() {
  return (
    <Component
      style={{
        alignContent: 'flex-end',
        backgroundColor: 'red',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        height: 200,
        justifyContent: 'center',
        padding: 20
      }}>
      <Animated.View
        style={{
          backgroundColor: 'blue',
          height: 50,
          width: 75
        }}
      />
      <Animated.View
        style={{ backgroundColor: 'blue', height: 75, width: 100 }}
      />
      <Animated.View
        style={{ backgroundColor: 'blue', minHeight: 50, width: 100 }}
      />
      <Animated.View
        style={{ backgroundColor: 'blue', height: 50, width: 100 }}
      />
      <Animated.View
        style={{ backgroundColor: 'blue', height: 50, width: 100 }}
      />
    </Component>
  );
}
