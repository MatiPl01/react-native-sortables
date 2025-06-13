import type {
  Context,
  ForwardedRef,
  ForwardRefExoticComponent,
  ForwardRefRenderFunction,
  PropsWithoutRef,
  RefAttributes
} from 'react';
import { forwardRef } from 'react';

import { IS_REACT_19 } from '../constants';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const componentWithRef = <T, P = {}>(
  render: ForwardRefRenderFunction<T, P>
): ForwardRefExoticComponent<P & RefAttributes<T>> => {
  if (IS_REACT_19) {
    return (({ ref, ...props }) =>
      render(props as P, ref as ForwardedRef<T>)) as ForwardRefExoticComponent<
      P & RefAttributes<T>
    >;
  }

  return forwardRef(
    render as ForwardRefRenderFunction<T, PropsWithoutRef<P>>
  ) as ForwardRefExoticComponent<P & RefAttributes<T>>;
};

export const getContextProvider = <T>(Context: Context<T>) => {
  return IS_REACT_19 ? Context : Context.Provider;
};
