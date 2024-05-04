import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import SortableFlexExample from './SortableFlexExample';
import SortableGridExample from './SortableGridExample';

type SpacerProps = {
  height: number;
};

function Spacer({ height }: SpacerProps) {
  return <View style={{ height }} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <SortableFlexExample />
        <Spacer height={20} />
        <SortableGridExample />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
