// Copied from: https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx

import { useRef } from 'react';
import type { TextInputProps, TextProps as RNTextProps } from 'react-native';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import type { AnimatedProps, SharedValue } from 'react-native-reanimated';
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { flex } from '@/theme';

Animated.addWhitelistedNativeProps({ text: true });

interface TextProps extends Omit<TextInputProps, 'style' | 'value'> {
  style?: AnimatedProps<RNTextProps>['style'];
  text: SharedValue<string>;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const AnimatedText = (props: TextProps) => {
  const { style, text, ...rest } = props;

  const textInternal = useSharedValue('');
  const textInputRef = useRef<TextInput>(null);

  useAnimatedReaction(
    () => text.value,
    newText => {
      textInternal.value = newText;
    }
  );

  const animatedProps = useAnimatedProps(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      ({
        text: textInternal.value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
  );

  return (
    <ScrollView contentContainerStyle={flex.fill} style={flex.fill}>
      <AnimatedTextInput
        editable={false}
        ref={textInputRef}
        style={[styles.baseStyle, style]}
        underlineColorAndroid='transparent'
        {...rest}
        {...{ animatedProps }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black'
  }
});

export default AnimatedText;
