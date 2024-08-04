/* eslint-disable import/no-unused-modules */
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useItemOrderChange<I>(
  initialData: Array<I>,
  selectedItem: number
): Array<I> {
  const [data, setData] = useState(initialData);
  const currentActiveIndexRef = useRef(selectedItem);

  const isFocused = useIsFocused();

  const moveActiveToIndex = useCallback(
    (index: number) => {
      setData(prevData => {
        const newData = [...prevData];
        const activeIndex = currentActiveIndexRef.current;
        const activeItem = newData[activeIndex];
        currentActiveIndexRef.current = index;

        if (activeItem) {
          newData.splice(activeIndex, 1);
          newData.splice(index, 0, activeItem);
          return newData;
        }
        return prevData;
      });
    },
    [setData]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isFocused) {
      interval = setInterval(() => {
        const newIndex =
          (currentActiveIndexRef.current +
            1 +
            Math.floor(Math.random() * initialData.length - 2)) %
          initialData.length;
        moveActiveToIndex(newIndex);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [moveActiveToIndex, isFocused, initialData]);

  return data;
}
