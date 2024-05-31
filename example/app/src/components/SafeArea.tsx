import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SafeAreaProps = {
  children: React.ReactNode;
};

export default function SafeArea({ children }: SafeAreaProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {children}
    </View>
  );
}
