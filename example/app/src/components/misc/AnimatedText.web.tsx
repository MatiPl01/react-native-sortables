import { useState } from 'react';
import type { TextInputProps, TextProps as RNTextProps } from 'react-native';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import type { AnimatedProps, SharedValue } from 'react-native-reanimated';
import Animated, {
  runOnJS,
  useAnimatedReaction
} from 'react-native-reanimated';

import { flex } from '@/theme';

interface TextProps extends Omit<TextInputProps, 'style' | 'value'> {
  style?: AnimatedProps<RNTextProps>['style'];
  text: SharedValue<string>;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const AnimatedText = (props: TextProps) => {
  const { style, text, ...rest } = props;
  const [value, setValue] = useState('');

  useAnimatedReaction(
    () => text.value,
    newText => {
      runOnJS(setValue)(newText);
    }
  );

  return (
    <ScrollView contentContainerStyle={flex.fill} style={flex.fill}>
      <AnimatedTextInput
        {...rest}
        style={[styles.baseStyle, style]}
        value={value}
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
