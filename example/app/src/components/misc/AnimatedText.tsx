// Copied from: https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx

import type { TextInputProps, TextProps as RNTextProps } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';
import type { AnimatedProps, SharedValue } from 'react-native-reanimated';
import Animated, { useAnimatedProps } from 'react-native-reanimated';

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black'
  }
});
Animated.addWhitelistedNativeProps({ text: true });

interface TextProps extends Omit<TextInputProps, 'style' | 'value'> {
  style?: AnimatedProps<RNTextProps>['style'];
  text: SharedValue<string>;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const AnimatedText = (props: TextProps) => {
  const { style, text, ...rest } = props;
  const animatedProps = useAnimatedProps(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      text: text.value
      // Here we use any because the text prop is not available in the type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });
  return (
    <AnimatedTextInput
      editable={false}
      style={[styles.baseStyle, style ?? undefined]}
      underlineColorAndroid='transparent'
      value={text.value}
      {...rest}
      {...{ animatedProps }}
    />
  );
};

export default AnimatedText;
