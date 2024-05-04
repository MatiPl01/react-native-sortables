import type { PropsWithChildren, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

type ContextReturnType<
  ContextName extends string,
  ContextValue,
  ProviderProps
> = {
  [K in ContextName as `${K}Provider`]: React.FC<ProviderProps>;
} & {
  [K in ContextName as `use${K}Context`]: () => ContextValue;
};

export default function createGuardedContext<ContextName extends string>(
  name: ContextName
) {
  return function <
    ContextValue extends object,
    ProviderProps extends PropsWithChildren<object>
  >(
    factory: (props: ProviderProps) => {
      value: ContextValue;
      children?: ReactNode;
    }
  ): ContextReturnType<ContextName, ContextValue, ProviderProps> {
    const Context = createContext<ContextValue | null>(null);
    Context.displayName = name;

    const Provider: React.FC<ProviderProps> = props => {
      const { children = props.children, value } = factory(props);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, react-hooks/exhaustive-deps
      const memoValue = useMemo(() => value, [...Object.values(value)]);

      return <Context.Provider value={memoValue}>{children}</Context.Provider>;
    };

    const useGuardedContext = (): ContextValue => {
      const context = useContext(Context);

      if (context === null) {
        throw new Error(
          `${name} context must be used within a ${name}Provider`
        );
      }

      return context;
    };

    return {
      [`${name}Provider`]: Provider,
      [`use${name}Context`]: useGuardedContext
    } as ContextReturnType<ContextName, ContextValue, ProviderProps>;
  };
}
