import { useCallback } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { IS_IOS } from '@/constants';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 20 }, (_, index) => ({
  id: index,
  name: `Exercise ${index + 1}`
}));

export default function InputFocusExample() {
  const renderExerciseItem = useCallback<
    SortableGridRenderItem<(typeof DATA)[0]>
  >(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.label}>{item.name}</Text>
        <TextInput
          keyboardType='numeric'
          placeholder={`Enter value for ${item.name}`}
          placeholderTextColor={colors.foreground3}
          style={styles.input}
        />
      </View>
    ),
    []
  );

  return (
    <KeyboardAvoidingView
      behavior={IS_IOS ? 'height' : undefined}
      keyboardVerticalOffset={100}
      style={styles.flex}>
      <ScrollScreen
        contentContainerStyle={styles.container}
        includeNavBarHeight>
        <Sortable.Grid
          activeItemScale={1.02}
          columnGap={spacing.md}
          columns={1}
          data={DATA}
          enableActiveItemSnap={false}
          overDrag='vertical'
          renderItem={renderExerciseItem}
          rowGap={spacing.sm}
          onDragStart={() => Keyboard.dismiss()}
        />
      </ScrollScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background2,
    borderRadius: radius.md,
    height: sizes.xl,
    padding: spacing.md
  },
  container: {
    padding: spacing.md
  },
  flex: {
    flex: 1
  },
  input: {
    backgroundColor: colors.background1,
    borderColor: colors.background3,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.foreground1,
    flex: 1,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...text.body2
  },
  label: {
    color: colors.foreground2,
    ...text.label1
  }
});
