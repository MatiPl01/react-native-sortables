import type { PropsWithChildren, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

type ContextReturnType<
  ContextName extends string,
  ContextValue,
  ProviderProps,
  Guarded extends boolean = true
> = {
  [K in ContextName as `${K}Provider`]: React.FC<ProviderProps>;
} & {
  [K in ContextName as `use${K}Context`]: () => Guarded extends true
    ? ContextValue
    : ContextValue | null;
};

export default function createEnhancedContext<
  ContextName extends string,
  Guarded extends boolean = true
>(name: ContextName, guarded?: Guarded) {
  return function <
    ContextValue extends object,
    ProviderProps extends PropsWithChildren<object>
  >(
    factory: (props: ProviderProps) => {
      value: ContextValue;
      children?: ReactNode;
    }
  ): ContextReturnType<ContextName, ContextValue, ProviderProps, Guarded> {
    const Context = createContext<ContextValue | null>(null);
    Context.displayName = name;

    const Provider: React.FC<ProviderProps> = props => {
      const { children = props.children, value } = factory(props);

      if (!value) {
        throw new Error(
          `${name}Context value must be provided. You likely forgot to return it from the factory function.`
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, react-hooks/exhaustive-deps
      const memoValue = useMemo(() => value, [...Object.values(value)]);

      return <Context.Provider value={memoValue}>{children}</Context.Provider>;
    };

    const useEnhancedContext = (): ContextValue | null => {
      const context = useContext(Context);

      if (guarded && context === null) {
        throw new Error(
          `${name} context must be used within a ${name}Provider`
        );
      }

      return context;
    };

    return {
      [`${name}Provider`]: Provider,
      [`use${name}Context`]: useEnhancedContext
    } as ContextReturnType<ContextName, ContextValue, ProviderProps>;
  };
}
