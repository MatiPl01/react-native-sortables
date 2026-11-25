import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import SortableLayer from './SortableLayer';

describe(SortableLayer, () => {
  it('passes view props to the rendered view', () => {
    const onLayout = jest.fn();

    render(
      <SortableLayer style={{ flex: 1 }} testID='layer' onLayout={onLayout}>
        <Text>content</Text>
      </SortableLayer>
    );

    const layer = screen.getByTestId('layer');
    expect(StyleSheet.flatten(layer.props.style)).toMatchObject({ flex: 1 });
    expect(layer.props.onLayout).toBe(onLayout);
    expect(screen.getByText('content')).toBeTruthy();
  });
});
