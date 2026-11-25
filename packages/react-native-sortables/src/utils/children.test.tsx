import type { ReactNode } from 'react';
import { View } from 'react-native';

import { processChildren } from './children';

const getKeys = (children: ReactNode) =>
  processChildren(children).map(([key]) => key);

describe('processChildren', () => {
  it('gives unique keys to children of fragments', () => {
    const keys = getKeys(
      <>
        <View />
        <>
          <View />
          <View key='a' />
        </>
        <>
          <View key='a' />
        </>
      </>
    );

    expect(new Set(keys).size).toBe(4);
  });

  it('keeps keys of children that are not in fragments', () => {
    expect(getKeys([<View key='a' />, <View key='b' />])).toEqual([
      '.$a',
      '.$b'
    ]);
  });
});
