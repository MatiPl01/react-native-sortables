import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useContext,
  useMemo
} from 'react';

import { error, getContextProvider } from '../../utils';

export default function createProvider<
  ProviderName extends string,
  Guarded extends boolean = true
>(name: ProviderName, options?: { guarded?: Guarded }) {
  return function <
    ProviderProps extends PropsWithChildren<object>,
    ContextValue
  >(
    factory: (props: ProviderProps) => {
      value?: ContextValue;
      enabled?: boolean;
      children?: ReactNode;
    }
  ) {
    const { guarded = true } = options ?? {};

    const Context = createContext<ContextValue | null>(null);
    Context.displayName = name;

    const Provider: React.FC<ProviderProps> = props => {
      const {
        children = props.children,
        enabled = true,
        value
      } = factory(props);

      if (!value) {
        throw error(
          `${name}Context value must be provided. You likely forgot to return it from the factory function.`
        );
      }

      const memoValue = useMemo(
        () => (enabled ? value : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        typeof value === 'object'
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            [enabled, ...Object.values(value)]
          : [enabled, value]
      );

      const ContextProvider = getContextProvider(Context);

      return <ContextProvider value={memoValue}>{children}</ContextProvider>;
    };

    const useEnhancedContext = (): ContextValue | null => {
      const context = useContext(Context);

      if (guarded && context === null) {
        throw error(`${name} context must be used within a ${name}Provider`);
      }

      return context;
    };

    return {
      [`${name}Context`]: Context,
      [`${name}Provider`]: Provider,
      [`use${name}Context`]: useEnhancedContext
    } as {
      [P in ProviderName as `${P}Context`]: React.Context<ContextValue>;
    } & {
      [P in ProviderName as `${P}Provider`]: React.FC<ProviderProps>;
    } & {
      [P in ProviderName as `use${P}Context`]: () => Guarded extends true
        ? ContextValue
        : ContextValue | null;
    };
  };
}
