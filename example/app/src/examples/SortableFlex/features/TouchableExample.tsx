import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import {
  AnimatedText,
  Button,
  FlexCell,
  Screen,
  Section,
  Stagger
} from '@/components';
import { flex } from '@/theme';

const DATA = [
  'Happy 😀',
  'Sad 😢',
  'Angry 😡',
  'Surprised 😮',
  'Confused 😕',
  'Disappointed 😞',
  'Disgusted 😒',
  'Excited 😄',
  'Frustrated 😤',
  'Grateful 😊',
  'Hopeful 😊',
  'Joyful 😊',
  'Love 😊'
];

const TEXT_LINE_HEIGHT = 16;

function limit<T extends Array<string>>(lines: T, maxLines: number): T {
  'worklet';
  return lines.slice(-maxLines) as T;
}

export default function TouchableExample() {
  const textLines = useSharedValue<Array<string>>([]);
  const maxLines = useSharedValue(10);
  const text = useDerivedValue(() => {
    return textLines.value.join('\n');
  });

  const onLongPress = useCallback(() => {
    textLines.modify(lines => {
      'worklet';
      lines.push('long press');
      return limit(lines, maxLines.value);
    });
  }, [textLines, maxLines]);

  const onTap = useCallback(() => {
    textLines.modify(lines => {
      'worklet';
      lines.push('tap');
      return limit(lines, maxLines.value);
    });
  }, [textLines, maxLines]);

  const onTouchesDown = useCallback(() => {
    textLines.modify(lines => {
      'worklet';
      lines.push('touches down');
      return limit(lines, maxLines.value);
    });
  }, [textLines, maxLines]);

  const onTouchesUp = useCallback(() => {
    textLines.modify(lines => {
      'worklet';
      lines.push('touches up');
      return limit(lines, maxLines.value);
    });
  }, [textLines, maxLines]);

  return (
    <Screen includeNavBarHeight>
      <Stagger wrapperStye={index => (index === 0 ? flex.fill : {})}>
        <Section
          title='Callback output'
          titleRight={
            <Button
              title='Clear'
              variant='small'
              onPress={() => {
                textLines.value = [];
              }}
            />
          }
          animateLayout
          fill>
          <AnimatedText
            scrollEnabled={false}
            style={styles.textInput}
            text={text}
            multiline
            onLayout={e => {
              maxLines.value = Math.floor(
                e.nativeEvent.layout.height / TEXT_LINE_HEIGHT
              );
            }}
          />
        </Section>

        <Section title='Callback output' animateLayout>
          <Sortable.Flex
            dragActivationDelay={0} // drag gesture will be immediately activated
            gap={10}
            customHandle>
            {DATA.map(item => (
              <Sortable.Handle key={item}>
                <Sortable.Touchable
                  onLongPress={onLongPress}
                  onTap={onTap}
                  onTouchesDown={onTouchesDown}
                  onTouchesUp={onTouchesUp}>
                  <FlexCell size='large'>{item}</FlexCell>
                </Sortable.Touchable>
              </Sortable.Handle>
            ))}
          </Sortable.Flex>
        </Section>
      </Stagger>
    </Screen>
  );
}

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    lineHeight: TEXT_LINE_HEIGHT
  }
});
