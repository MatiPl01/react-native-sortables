import { ScrollView, StyleSheet } from 'react-native';
import Sortable from 'react-native-sortable';

import { FlexCell, Section, Stagger } from '@/components';
import { CustomDropIndicator } from '@/examples/custom';
import { radius, spacing } from '@/theme';
import { getCategories } from '@/utils';

const DATA = getCategories(9);

export default function DropIndicatorExample() {
  return (
    <ScrollView>
      <Stagger ParentComponent={Sortable.Layer}>
        <Section title='Without drop indicator'>
          <Sortable.Flex style={styles.sortableFlex}>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Section>

        <Section
          description='With custom style that changes border radius of the default drop indicator'
          title='Default drop indicator'>
          <Sortable.Flex
            dropIndicatorStyle={styles.dropIndicatorStyle}
            style={styles.sortableFlex}
            showDropIndicator>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Section>

        <Section
          description='Looks better without inactive item opacity, so inactiveItemOpacity is set to 1 in this example'
          title='Custom drop indicator'>
          <Sortable.Flex
            DropIndicatorComponent={CustomDropIndicator}
            dropIndicatorStyle={styles.dropIndicatorStyle}
            inactiveItemOpacity={1}
            style={styles.sortableFlex}
            showDropIndicator>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Section>
      </Stagger>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dropIndicatorStyle: {
    borderRadius: radius.full
  },
  sortableFlex: {
    columnGap: spacing.xs,
    rowGap: spacing.xxs
  }
});
