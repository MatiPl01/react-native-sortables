// Copied from: https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx

import { useRef } from 'react';
import type { TextInputProps, TextProps as RNTextProps } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';
import type { AnimatedProps, SharedValue } from 'react-native-reanimated';
import Animated, {
  LinearTransition,
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
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
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const { style, text, ...rest } = props;

  const textInternal = useSharedValue('');
  const textInputRef = useRef<TextInput>(null);

  useAnimatedReaction(
    () => text.value,
    newText => {
      scrollTo(scrollViewRef, 0, 0, false);
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
    <Animated.ScrollView
      contentContainerStyle={flex.fill}
      ref={scrollViewRef}
      style={flex.fill}>
      <AnimatedTextInput
        editable={false}
        layout={LinearTransition}
        ref={textInputRef}
        style={[styles.baseStyle, style]}
        underlineColorAndroid='transparent'
        {...rest}
        {...{ animatedProps }}
      />
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black'
  }
});

export default AnimatedText;
