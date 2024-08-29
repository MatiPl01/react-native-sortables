import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { cancelAnimation, makeMutable } from 'react-native-reanimated';

import { useDebouncedStableCallback } from '../../hooks';
import { createProvider } from '../../providers/utils';
import { zipArrays } from '../../utils';
import type {
  DebugComponentUpdater,
  DebugCrossUpdater,
  DebugLineUpdater,
  DebugRectUpdater,
  DebugViews
} from '../types';
import { DebugComponentType } from '../types';

type DebugProviderContextType = {
  useDebugLine: () => DebugLineUpdater;
  useDebugRect: () => DebugRectUpdater;
  useDebugCross: () => DebugCrossUpdater;
  useDebugLines: <K extends string>(
    ...keys: Array<K>
  ) => Record<K, DebugLineUpdater>;
  useDebugRects: <K extends string>(
    ...keys: Array<K>
  ) => Record<K, DebugRectUpdater>;
  useObserver: (observer: (views: DebugViews) => void) => void;
};

type DebugProviderProps = PropsWithChildren<unknown>;

const { DebugProvider, useDebugContext } = createProvider('Debug', {
  guarded: false
})<DebugProviderProps, DebugProviderContextType>(() => {
  const debugIdRef = useRef(0);
  const debugViewsRef = useRef<DebugViews>({});
  const observersRef = useRef(() => new Set<(views: DebugViews) => void>());

  const notifyObservers = useDebouncedStableCallback(() => {
    const views = debugViewsRef.current;
    observersRef.current().forEach(observer => observer(views));
  });

  const createUpdater = useCallback(<T extends DebugComponentType>(type: T) => {
    const props = makeMutable({ visible: false });
    return {
      props,
      type,
      update(newProps: typeof props.value) {
        'worklet';
        props.value = newProps;
      }
    } as unknown as DebugComponentUpdater<T>;
  }, []);

  const addUpdater = useCallback(
    <U extends DebugComponentUpdater<DebugComponentType>>(
      key: number,
      updater: U
    ) => {
      debugViewsRef.current[key] = updater;
      notifyObservers();
      return updater;
    },
    [notifyObservers]
  );

  const removeUpdater = useCallback(
    (key: number) => {
      const updater = debugViewsRef.current[key];
      if (!updater) {
        return;
      }
      cancelAnimation(updater.props as SharedValue);
      delete debugViewsRef.current[key];
      notifyObservers();
    },
    [notifyObservers]
  );

  const useDebugComponent = useCallback(
    <T extends DebugComponentType>(type: T) => {
      const key = useMemo(() => debugIdRef.current++, []);
      const updater = useMemo(
        () => addUpdater(key, createUpdater(type)),
        [type, key]
      );

      useEffect(() => {
        return () => {
          removeUpdater(key);
        };
      }, [updater, key]);

      return updater;
    },
    [removeUpdater, createUpdater, addUpdater]
  );

  const useDebugComponents = useCallback(
    <T extends DebugComponentType, K extends string>(
      type: T,
      resultKeys: Array<K>
    ): Record<K, DebugComponentUpdater<T>> => {
      const keys = useMemo(
        () => resultKeys.map(() => debugIdRef.current++),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [...resultKeys]
      );
      const updaters = useMemo(
        () =>
          Object.fromEntries(
            zipArrays(keys, resultKeys).map(([key, resultKey]) => [
              resultKey,
              addUpdater(key, createUpdater(type))
            ])
          ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [keys, type]
      );

      useEffect(() => {
        return () => {
          keys.forEach(removeUpdater);
        };
      }, [keys]);

      return updaters as Record<K, DebugComponentUpdater<T>>;
    },
    [removeUpdater, createUpdater, addUpdater]
  );

  const useDebugLine = useCallback(
    () => useDebugComponent(DebugComponentType.Line),
    [useDebugComponent]
  );

  const useDebugRect = useCallback(
    () => useDebugComponent(DebugComponentType.Rect),
    [useDebugComponent]
  );

  const useDebugCross = useCallback(
    () => useDebugComponent(DebugComponentType.Cross),
    [useDebugComponent]
  );

  const useDebugLines = useCallback(
    <K extends string>(...keys: Array<K>) =>
      useDebugComponents(DebugComponentType.Line, keys),
    [useDebugComponents]
  );

  const useDebugRects = useCallback(
    <K extends string>(...keys: Array<K>) =>
      useDebugComponents(DebugComponentType.Rect, keys),
    [useDebugComponents]
  );

  const useObserver = useCallback((observer: (views: DebugViews) => void) => {
    useEffect(() => {
      const observers = observersRef.current();
      observers.add(observer);
      // Notify the observer immediately after adding it
      observer(debugViewsRef.current);
      return () => {
        observers.delete(observer);
      };
    }, [observer]);
  }, []);

  return {
    value: {
      useDebugCross,
      useDebugLine,
      useDebugLines,
      useDebugRect,
      useDebugRects,
      useObserver
    }
  };
});

export { DebugProvider, useDebugContext };
