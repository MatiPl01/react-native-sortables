import { Children, ReactElement, ReactNode, isValidElement } from "react";

export const validateChildren = (children: ReactNode): [string, ReactElement][] =>
  Children.toArray(children).reduce((acc: [string, ReactElement][], child, index) => {
    if (!isValidElement(child)) {
      return acc
    }

    const key = child.key as string;

    if (!key) {
      console.warn(`Child at index ${index} is missing a key prop. Using index as fallback.`);
    }

    acc.push([key || String(index), child]);

    return acc;
  }, []);
