import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import SortableFlexExample from './SortableFlexExample';
import SortableGridExample from './SortableGridExample';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeArea } from './components';

type SpacerProps = {
  height: number;
};

function Spacer({ height }: SpacerProps) {
  return <View style={{ height }} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <SafeArea>
          <SortableFlexExample />
          <Spacer height={20} />
          <SortableGridExample />
        </SafeArea>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
