import { ScrollView } from 'react-native';
import { SortableFlex } from 'react-native-sortable';

import { Group } from '@/components';
import { FlexCell } from '@/components/items';
import { getCategories } from '@/utils';

const DATA = getCategories(10);

export default function DropIndicatorExample() {
  return (
    <ScrollView>
      <Group>
        <SortableFlex showDropIndicator>
          {DATA.map(item => (
            <FlexCell key={item}>{item}</FlexCell>
          ))}
        </SortableFlex>
      </Group>
    </ScrollView>
  );
}
