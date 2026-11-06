import { render } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import type * as Reanimated from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import { CommonValuesProvider } from './CommonValuesProvider';

let mockIsWeb = false;

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<typeof Reanimated>(
    'react-native-reanimated'
  );
  return { ...actual, useDerivedValue: jest.fn(actual.useDerivedValue) };
});

jest.mock('../../constants/platform', () => ({
  get IS_WEB() {
    return mockIsWeb;
  }
}));

jest.mock('./ItemsProvider', () => ({
  useItemsContext: () => ({
    getKeys: () => [],
    subscribeKeys: () => () => undefined
  })
}));

const mockUseDerivedValue = jest.mocked(useDerivedValue);

const props = {
  activationAnimationDuration: 0,
  activeItemOpacity: 1,
  activeItemScale: 1,
  activeItemShadowOpacity: 0,
  autoScrollDirection: 'vertical',
  controlledContainerDimensions: { height: false, width: false },
  controlledItemDimensions: { height: false, width: false },
  customHandle: false,
  dragActivationDelay: 0,
  dragActivationFailOffset: 0,
  dropAnimationDuration: 0,
  enableActiveItemSnap: false,
  inactiveItemOpacity: 1,
  inactiveItemScale: 1,
  itemsLayoutTransitionMode: 'all',
  snapOffsetX: 0,
  snapOffsetY: 0,
  sortEnabled: true,
  stackingOrder: 'asc'
} as ComponentProps<typeof CommonValuesProvider>;

const dependenciesOf = () =>
  mockUseDerivedValue.mock.calls.map(([, dependencies]) => dependencies);

describe('CommonValuesProvider', () => {
  it('does not pass dependencies to useDerivedValue on native, where Reanimated warns about them', () => {
    mockIsWeb = false;

    render(<CommonValuesProvider {...props} />);

    expect(dependenciesOf().length).toBeGreaterThan(0);
    expect(dependenciesOf().every(deps => deps === undefined)).toBe(true);
  });

  it('passes dependencies to useDerivedValue on web, where Reanimated needs them', () => {
    mockIsWeb = true;

    render(<CommonValuesProvider {...props} />);

    // Reanimated appends the worklet hash to the array it receives, and
    // useAnimatableValue contributes arrays of its own, always two values wide.
    // The provider's single dependency plus that hash is the only pair.
    expect(dependenciesOf()).toContainEqual([
      props.itemsLayoutTransitionMode,
      expect.any(Number)
    ]);
  });
});
