import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type RowProps = PropsWithChildren<Pick<ViewProps, 'onLayout'> & ViewStyle>;

export default function Row({ children, onLayout, ...style }: RowProps) {
  return (
    <View style={[styles.row, style]} onLayout={onLayout}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row'
  }
});
