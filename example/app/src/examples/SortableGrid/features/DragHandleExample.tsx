import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { OverDrag, SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { OptionGroup, SimpleDropdown, Spacer, TabSelector } from '@/components';
import { IS_WEB } from '@/constants';
import { useBottomNavBarHeight } from '@/contexts';
import { colors, flex, radius, sizes, spacing, style, text } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(20);

const COLUMNS = [1, 2, 3, 4];
const OVER_DRAG: Array<OverDrag> = ['both', 'horizontal', 'vertical', 'none'];

export default function DragHandleExample() {
  const bottomNavBarHeight = useBottomNavBarHeight();
  const [columns, setColumns] = useState(1);
  const [overDrag, setOverDrag] = useState<OverDrag>('both');
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
        <Sortable.Handle>
          <FontAwesomeIcon color={colors.white} icon={faGripVertical} />
        </Sortable.Handle>
      </View>
    ),
    []
  );

  return (
    <>
      <View style={styles.options}>
        <OptionGroup label='columns'>
          <TabSelector
            selectedTab={columns}
            tabs={COLUMNS}
            onSelectTab={setColumns}
          />
        </OptionGroup>
        <OptionGroup label='overDrag'>
          <SimpleDropdown
            options={OVER_DRAG}
            selected={overDrag}
            onSelect={setOverDrag}
          />
        </OptionGroup>
      </View>
      <Animated.ScrollView
        contentContainerStyle={[IS_WEB && style.webContent, styles.container]}
        ref={scrollableRef}
        style={flex.fill}>
        <Sortable.Grid
          activeItemScale={1}
          columnGap={10}
          columns={columns}
          data={DATA}
          dragActivationDelay={0}
          overDrag={overDrag}
          renderItem={renderItem}
          rowGap={10}
          scrollableRef={scrollableRef}
          customHandle
        />
        <Spacer height={bottomNavBarHeight} />
      </Animated.ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.md,
    flexDirection: 'row',
    height: sizes.lg,
    justifyContent: 'space-between',
    padding: spacing.md
  },
  container: {
    padding: spacing.md
  },
  options: {
    ...(IS_WEB && style.webContent),
    paddingBottom: spacing.sm
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
