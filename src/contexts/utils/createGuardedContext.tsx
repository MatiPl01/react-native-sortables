import { createContext, useContext } from 'react';

type ContextReturnType<T, U extends string> = {
  [K in U as `${K}`]: React.Context<T>;
} & {
  [K in U as `use${K}`]: () => T;
};

export default function createGuardedContext<T>() {
  return function <U extends string>(name: U): ContextReturnType<T, U> {
    const Context = createContext<T | null>(null);
    Context.displayName = name;

    const useGuardedContext = (): T => {
      const context = useContext(Context);

      if (context === null) {
        throw new Error(
          `${name} context must be used within a ${name}Provider`
        );
      }

      return context as T;
    };

    return {
      [`use${name}`]: useGuardedContext,
      [name]: Context
    } as ContextReturnType<T, U>;
  };
}
