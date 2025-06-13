import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function useItemOrderChange<I>(
  initialData: Array<I>,
  selectedIndex: number
): Array<I> {
  const [data, setData] = useState(initialData);
  const currentActiveIndexRef = useRef(selectedIndex);
  const selectedItem = useMemo(
    () => initialData[selectedIndex],
    [initialData, selectedIndex]
  );

  const isFocused = useIsFocused();

  const moveActiveToIndex = useCallback(
    (index: number) => {
      setData(prevData => {
        const newData = [...prevData];
        const currentActiveIndex = prevData.findIndex(
          item => item === selectedItem
        );
        const activeItem = newData[currentActiveIndex];
        currentActiveIndexRef.current = index;

        if (activeItem) {
          newData.splice(currentActiveIndex, 1);
          newData.splice(index, 0, activeItem);
          return newData;
        }
        return prevData;
      });
    },
    [setData, selectedItem]
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
