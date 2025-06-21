import { useState } from 'react';
import { makeMutable } from 'react-native-reanimated';

export default function useMutableValue<T>(initialValue: T) {
  const [mutable] = useState(makeMutable(initialValue));
  return mutable;
}
