import { useCallback } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Sortable, {
  type DragEndCallback,
  type DragStartCallback,
  type OrderChangeCallback
} from 'react-native-sortables';

import { AnimatedText, FlexCell, Section, Stagger } from '@/components';
import { flex, sizes, spacing } from '@/theme';
import { formatCallbackParams, getCategories } from '@/utils';

const DATA = getCategories(9);

export default function CallbacksExample() {
  const text = useSharedValue('Callback output will be displayed here');

  const onDragStart = useCallback<DragStartCallback>(
    params => {
      text.value = `onDragStart:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const onDragEnd = useCallback<DragEndCallback>(
    params => {
      text.value = `onDragEnd:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const onOrderChange = useCallback<OrderChangeCallback>(
    params => {
      text.value = `onOrderChange:${formatCallbackParams(params)}`;
    },
    [text]
  );

  return (
    <View style={styles.container}>
      <Stagger wrapperStye={index => (index === 0 ? flex.fill : {})}>
        <Section title='Callback output' fill>
          <AnimatedText style={flex.fill} text={text} multiline />
        </Section>
        <Section
          description='Drag items around to see callbacks output'
          title='SortableFlex'>
          <Sortable.Flex
            columnGap={spacing.sm}
            rowGap={spacing.xs}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
            onOrderChange={onOrderChange}>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Section>
      </Stagger>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height:
      Dimensions.get('window').height -
      (Platform.OS === 'ios' ? sizes.xxl : sizes.lg)
  }
});
