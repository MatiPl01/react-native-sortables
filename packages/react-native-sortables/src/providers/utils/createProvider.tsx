/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-redeclare */
import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useContext,
  useMemo
} from 'react';
import { SortablesError } from '../../utils';

export default function createProvider<ProviderName extends string>(
  name: ProviderName,
  options: { withContext: false }
): <ProviderProps extends PropsWithChildren<object>>(
  factory: (props: ProviderProps) => { children: ReactNode } | void
) => {
  [P in ProviderName as `${P}Provider`]: React.FC<ProviderProps>;
};

export default function createProvider<
  ProviderName extends string,
  Guarded extends boolean = true
>(
  name: ProviderName,
  options?: { withContext?: true; guarded?: Guarded }
): <
  ProviderProps extends PropsWithChildren<object>,
  ContextValue extends object
>(
  factory: (props: ProviderProps) => {
    value: ContextValue;
    children?: ReactNode;
  }
) => {
  [P in ProviderName as `${P}Provider`]: React.FC<ProviderProps>;
} & {
  [P in ProviderName as `use${P}Context`]: () => Guarded extends true
    ? ContextValue
    : ContextValue | null;
};

export default function createProvider<
  ProviderName extends string,
  Guarded extends boolean = true
>(name: ProviderName, options?: { withContext?: boolean; guarded?: Guarded }) {
  return function <
    ProviderProps extends PropsWithChildren<object>,
    ContextValue extends object
  >(
    factory: (props: ProviderProps) => {
      value?: ContextValue;
      children?: React.ReactNode;
    } | void
  ) {
    const { guarded = true, withContext = true } = options ?? {};

    if (!withContext) {
      const Provider: React.FC<ProviderProps> = props => {
        const { children = props.children } = factory(props) ?? {};
        return <>{children}</>;
      };

      return { [`${name}Provider`]: Provider } as any;
    }

    const Context = createContext<ContextValue | null>(null);
    Context.displayName = name;

    const Provider: React.FC<ProviderProps> = props => {
      const { children = props.children, value } = factory(props) as {
        value?: ContextValue;
        children?: React.ReactNode;
      };

      if (!value) {
        throw new SortablesError(
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
        throw new SortablesError(
          `${name} context must be used within a ${name}Provider`
        );
      }

      return context;
    };

    return {
      [`${name}Provider`]: Provider,
      [`use${name}Context`]: useEnhancedContext
    } as any;
  };
}
