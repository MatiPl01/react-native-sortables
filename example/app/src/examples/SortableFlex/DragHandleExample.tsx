import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { OverDrag } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { OptionGroup, SimpleDropdown } from '@/components';
import { colors, flex, radius, sizes, spacing, style, text } from '@/theme';
import { getCategories } from '@/utils';

import { iconSizes } from '../../theme/icons';

const DATA = getCategories(30);

const OVER_DRAG: Array<OverDrag> = ['both', 'horizontal', 'vertical', 'none'];

export default function DragHandleExample() {
  const [overDrag, setOverDrag] = useState<OverDrag>('both');
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <>
      <View style={styles.options}>
        <OptionGroup label='overDrag'>
          <SimpleDropdown
            options={OVER_DRAG}
            selected={overDrag}
            onSelect={setOverDrag}
          />
        </OptionGroup>
      </View>
      <Animated.ScrollView
        contentContainerStyle={[style.contentContainer, styles.container]}
        ref={scrollableRef}
        style={flex.fill}>
        <Sortable.Flex
          activeItemScale={1}
          columnGap={10}
          dragActivationDelay={0}
          overDrag={overDrag}
          rowGap={10}
          scrollableRef={scrollableRef}
          customHandle>
          {DATA.map(item => (
            <View key={item} style={styles.card}>
              <Text style={styles.text}>{item}</Text>
              <Sortable.Handle>
                <FontAwesomeIcon
                  color={colors.white}
                  icon={faGripVertical}
                  size={iconSizes.sm}
                />
              </Sortable.Handle>
            </View>
          ))}
        </Sortable.Flex>
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
    gap: spacing.xxs,
    height: sizes.lg,
    justifyContent: 'space-between',
    padding: spacing.md
  },
  container: {
    padding: spacing.md
  },
  options: {
    ...style.webContent,
    paddingBottom: spacing.sm
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
