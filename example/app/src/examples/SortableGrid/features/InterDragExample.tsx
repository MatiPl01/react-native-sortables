import { useCallback, useState } from 'react';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { GridCard, Group } from '@/components';
import { IS_WEB } from '@/constants';
import { style } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(18);
const LENGTH = DATA.length;

export default function InterDragExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [data1, setData1] = useState(() => DATA.slice(0, LENGTH / 2));
  const [data2, setData2] = useState(() => DATA.slice(LENGTH / 2));

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <Animated.ScrollView
      contentContainerStyle={IS_WEB && style.webContent}
      ref={scrollableRef}
      removeClippedSubviews={false}>
      <Sortable.InterDragProvider>
        <Sortable.Layer>
          <Group>
            <Sortable.Grid
              columnGap={10}
              columns={3}
              data={data1}
              renderItem={renderItem}
              rowGap={10}
              onDragEnd={params => setData1(params.data)}
            />
          </Group>
        </Sortable.Layer>
        <Sortable.Layer>
          <Group>
            <Sortable.Grid
              columnGap={10}
              columns={3}
              data={data2}
              renderItem={renderItem}
              rowGap={10}
              onDragEnd={params => setData2(params.data)}
            />
          </Group>
        </Sortable.Layer>
      </Sortable.InterDragProvider>
    </Animated.ScrollView>
  );
}
