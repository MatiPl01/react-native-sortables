import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Sortable, {
  type DragEndCallback,
  type DragStartCallback,
  type OrderChangeCallback
} from 'react-native-sortable';

import { AnimatedText, FlexCell, Section, Stagger } from '@/components';
import { flex, spacing } from '@/theme';
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
    <Stagger wrapperStye={index => (index === 0 ? flex.fill : {})}>
      <Section title='Callback output' fill>
        <AnimatedText style={flex.fill} text={text} multiline />
      </Section>
      <Section
        description='Drag items around to see callbacks output'
        title='SortableFlex'>
        <Sortable.Flex
          style={styles.sortableFlex}
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
  );
}

const styles = StyleSheet.create({
  sortableFlex: { columnGap: spacing.xs, rowGap: spacing.xxs }
});
