import type { ReactElement, ReactNode } from 'react';
import { Children, Fragment, isValidElement } from 'react';

export const childrenToArray = (
  children: ReactNode
): Array<[string, ReactElement]> =>
  Children.toArray(children).reduce(
    (acc: Array<[string, ReactElement]>, child) => {
      if (!isValidElement(child)) {
        return acc;
      }

      // Handle React Fragments by recursively processing their children
      if (child.type === Fragment) {
        const fragmentChildren = childrenToArray(
          (child.props as { children: ReactNode }).children
        );
        return [...acc, ...fragmentChildren];
      }

      return acc;
    },
    []
  );
