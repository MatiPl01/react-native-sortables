import { renderHook } from '@testing-library/react-hooks';
import type { SharedValue } from 'react-native-reanimated';
import { makeMutable } from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemZIndex from './useItemZIndex';

jest.mock('../CommonValuesProvider', () => ({
  useCommonValuesContext: jest.fn()
}));

const mockedUseCommonValuesContext = useCommonValuesContext as jest.Mock;

type ContextOverrides = {
  activeItemBroughtToFront?: boolean;
  activeItemKey?: null | string;
  prevActiveItemKey?: null | string;
  isStackingOrderDesc?: boolean;
  indexToKey?: Array<string>;
};

function setupContext({
  activeItemBroughtToFront = false,
  activeItemKey = null,
  indexToKey = ['a', 'b', 'c'],
  isStackingOrderDesc = false,
  prevActiveItemKey = null
}: ContextOverrides) {
  const keyToIndex = Object.fromEntries(indexToKey.map((key, i) => [key, i]));
  mockedUseCommonValuesContext.mockReturnValue({
    activeItemBroughtToFront: makeMutable(activeItemBroughtToFront),
    activeItemKey: makeMutable(activeItemKey),
    indexToKey: makeMutable(indexToKey),
    isStackingOrderDesc,
    keyToIndex: makeMutable(keyToIndex),
    prevActiveItemKey: makeMutable(prevActiveItemKey)
  });
}

function renderZIndex(key: string, activationProgress: number): number {
  const progress = makeMutable(activationProgress);
  const { result } = renderHook(() => useItemZIndex(key, progress)) as {
    result: { current: SharedValue<number> };
  };
  return result.current.value;
}

// itemCount = 3 in all cases below

describe(useItemZIndex, () => {
  describe('when the active item has NOT been brought to front (long press)', () => {
    it('keeps the active item at its plain order zIndex', () => {
      setupContext({
        activeItemBroughtToFront: false,
        activeItemKey: 'a'
      });
      // active + activation running, but not brought to front => order zIndex
      expect(renderZIndex('a', 1)).toBe(0);
    });

    it('keeps inactive items at their plain order zIndex', () => {
      setupContext({
        activeItemBroughtToFront: false,
        activeItemKey: 'a'
      });
      expect(renderZIndex('b', 1)).toBe(1);
      expect(renderZIndex('c', 1)).toBe(2);
    });

    it('respects descending stacking order', () => {
      setupContext({
        activeItemBroughtToFront: false,
        activeItemKey: 'a',
        isStackingOrderDesc: true
      });
      // desc order zIndex for index 0 of 3 items => 3 - 0 - 1 = 2
      expect(renderZIndex('a', 1)).toBe(2);
    });
  });

  describe('when the active item HAS been brought to front (real drag)', () => {
    it('elevates the active item above everything', () => {
      setupContext({
        activeItemBroughtToFront: true,
        activeItemKey: 'a'
      });
      // 2 * itemCount + 1 = 7
      expect(renderZIndex('a', 1)).toBe(7);
    });

    it('lifts inactive items by itemCount while the activation runs', () => {
      setupContext({
        activeItemBroughtToFront: true,
        activeItemKey: 'a'
      });
      // itemCount + orderZIndex
      expect(renderZIndex('b', 1)).toBe(4);
      expect(renderZIndex('c', 1)).toBe(5);
    });

    it('keeps the previously active item above siblings during the drop', () => {
      setupContext({
        activeItemBroughtToFront: true,
        activeItemKey: null,
        prevActiveItemKey: 'a'
      });
      // 2 * itemCount = 6 for the dropping item
      expect(renderZIndex('a', 0.5)).toBe(6);
      // other items are lifted by itemCount while the drop animates
      expect(renderZIndex('b', 0.5)).toBe(4);
    });
  });

  describe('at rest (no active item, animation finished)', () => {
    it.each([false, true])(
      'returns the plain order zIndex (broughtToFront=%s)',
      broughtToFront => {
        setupContext({
          activeItemBroughtToFront: broughtToFront,
          activeItemKey: null,
          prevActiveItemKey: 'a'
        });
        // a stale broughtToFront=true is harmless at rest
        expect(renderZIndex('a', 0)).toBe(0);
        expect(renderZIndex('b', 0)).toBe(1);
        expect(renderZIndex('c', 0)).toBe(2);
      }
    );
  });
});
