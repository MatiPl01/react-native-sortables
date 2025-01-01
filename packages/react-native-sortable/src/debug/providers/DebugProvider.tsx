import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { cancelAnimation, makeMutable } from 'react-native-reanimated';

import { useDebouncedStableCallback } from '../../hooks';
import { createProvider } from '../../providers/utils';
import type { DebugProviderContextType } from '../../types';
import type { DebugComponentUpdater, DebugViews } from '../../types/debug';
import { DebugComponentType } from '../../types/debug';

type DebugProviderProps = PropsWithChildren<unknown>;

const { DebugProvider, useDebugContext } = createProvider('Debug', {
  guarded: false
})<DebugProviderProps, DebugProviderContextType>(() => {
  const debugIdRef = useRef(0);
  const debugViewsRef = useRef<DebugViews>({});
  const observersRef = useRef(new Set<(views: DebugViews) => void>());

  const getNextKey = useCallback(() => debugIdRef.current++, []);

  const notifyObservers = useDebouncedStableCallback(() => {
    const views = debugViewsRef.current;
    for (const observer of observersRef.current) {
      observer({ ...views });
    }
  });

  const createUpdater = useCallback(
    <T extends DebugComponentType>(type: T): DebugComponentUpdater<T> => {
      const props = makeMutable({ visible: false });
      return {
        hide() {
          'worklet';
          props.value = { ...props.value, visible: false };
        },
        props,
        set(newProps: DebugComponentUpdater<T>['set']) {
          'worklet';
          if (typeof newProps === 'function') {
            const prevProps = props.value;
            props.value = (newProps as <P>(prevProps: P) => P)(prevProps);
          } else {
            props.value = newProps;
          }
        },
        type
      } as unknown as DebugComponentUpdater<T>;
    },
    []
  );

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
      const key = useMemo(getNextKey, []);
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
    [removeUpdater, createUpdater, addUpdater, getNextKey]
  );

  const useDebugComponents = useCallback(
    <T extends DebugComponentType>(
      type: T,
      keysOrCount: Array<string> | number
    ) => {
      const isNumber = typeof keysOrCount === 'number';
      const [keys] = useState(
        isNumber ? ([] as Array<number>) : ({} as Record<string, number>)
      );
      const [updaters] = useState(() =>
        isNumber
          ? ([] as Array<DebugComponentUpdater<DebugComponentType>>)
          : ({} as Record<string, DebugComponentUpdater<DebugComponentType>>)
      );

      useEffect(() => {
        return () => {
          for (const key of Object.values(keys)) {
            removeUpdater(key);
          }
        };
      }, [keys]);

      if (isNumber && Array.isArray(keys) && Array.isArray(updaters)) {
        if (keys.length < keysOrCount) {
          for (let i = keys.length; i < keysOrCount; i++) {
            const key = getNextKey();
            keys.push(key);
            updaters.push(addUpdater(key, createUpdater(type)));
          }
        } else {
          const removedKeys = keys.splice(keysOrCount);
          updaters.splice(keysOrCount);
          removedKeys.forEach(removeUpdater);
        }
      } else if (
        !isNumber &&
        !Array.isArray(keys) &&
        !Array.isArray(updaters)
      ) {
        const resultKeySet = new Set(keysOrCount);
        for (const [resultKey, key] of Object.entries(keys)) {
          if (!resultKeySet.has(resultKey)) {
            removeUpdater(key);
            delete keys[resultKey];
            delete updaters[resultKey];
          }
        }
        for (const resultKey of keysOrCount) {
          if (!updaters[resultKey]) {
            const key = getNextKey();
            keys[resultKey] = key;
            updaters[resultKey] = addUpdater(key, createUpdater(type));
          }
        }
      }
      return Array.isArray(updaters) ? [...updaters] : { ...updaters };
    },
    [removeUpdater, createUpdater, addUpdater, getNextKey]
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
    (keysOrCount: Array<string> | number) =>
      useDebugComponents(DebugComponentType.Line, keysOrCount),
    [useDebugComponents]
  );

  const useDebugRects = useCallback(
    (keysOrCount: Array<string> | number) =>
      useDebugComponents(DebugComponentType.Rect, keysOrCount),
    [useDebugComponents]
  );

  const useObserver = useCallback((observer: (views: DebugViews) => void) => {
    useEffect(() => {
      const observers = observersRef.current;
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
      useDebugLines: useDebugLines as DebugProviderContextType['useDebugLines'],
      useDebugRect,
      useDebugRects: useDebugRects as DebugProviderContextType['useDebugRects'],
      useObserver
    }
  };
});

export { DebugProvider, useDebugContext };
