import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedRef
} from 'react-native-reanimated';
import type { OverDrag, SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import {
  CheckBox,
  OptionGroup,
  SimpleDropdown,
  Spacer,
  TabSelector
} from '@/components';
import { IS_WEB } from '@/constants';
import { useBottomNavBarHeight } from '@/providers';
import { colors, flex, radius, sizes, spacing, style, text } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(20);

const COLUMNS = [1, 2, 3, 4];
const OVER_DRAG: Array<OverDrag> = ['both', 'horizontal', 'vertical', 'none'];

export default function DragHandleExample() {
  const bottomNavBarHeight = useBottomNavBarHeight();
  const [columns, setColumns] = useState(1);
  const [overDrag, setOverDrag] = useState<OverDrag>('both');
  const [changeHeight, setChangeHeight] = useState(false);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const cardHeight = changeHeight ? columns * sizes.md : sizes.lg;

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <Animated.View
        layout={LinearTransition}
        style={[styles.card, { height: cardHeight }]}>
        <Animated.Text layout={LinearTransition} style={styles.text}>
          {item}
        </Animated.Text>
        <Animated.View layout={LinearTransition}>
          <Sortable.Handle>
            <FontAwesomeIcon color={colors.white} icon={faGripVertical} />
          </Sortable.Handle>
        </Animated.View>
      </Animated.View>
    ),
    [cardHeight]
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
        <OptionGroup label='change height with columns'>
          <CheckBox selected={changeHeight} onChange={setChangeHeight} />
        </OptionGroup>
      </View>
      <Animated.ScrollView
        contentContainerStyle={[IS_WEB && style.webContent, styles.container]}
        ref={scrollableRef}
        style={flex.fill}>
        <Sortable.Grid
          activeItemScale={1}
          autoScrollMaxOverscroll={[50, 120]}
          columnGap={10}
          columns={columns}
          data={DATA}
          dimensionsAnimationType='layout'
          dragActivationDelay={0}
          overDrag={overDrag}
          overflow='visible'
          renderItem={renderItem}
          rowGap={10}
          scrollableRef={scrollableRef}
          customHandle
          debug
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
