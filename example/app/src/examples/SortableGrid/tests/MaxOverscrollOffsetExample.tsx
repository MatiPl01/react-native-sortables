import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { GridCard, Screen } from '@/components';
import { IS_WEB } from '@/constants';
import { spacing, style } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(15);

export default function MaxOverscrollOffsetExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <Screen>
      <Animated.ScrollView
        contentContainerStyle={[IS_WEB && style.webContent, styles.container]}
        ref={scrollableRef}
        removeClippedSubviews={false}
        scrollToOverflowEnabled>
        <Sortable.Grid
          autoScrollMaxOverscroll={[200, 300]}
          columnGap={spacing.md}
          columns={3}
          data={DATA}
          renderItem={renderItem}
          rowGap={spacing.md}
          scrollableRef={scrollableRef}
          debug
        />
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md
  }
});
