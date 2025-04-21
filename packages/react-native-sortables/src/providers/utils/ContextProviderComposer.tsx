import type { JSX, PropsWithChildren } from 'react';
import { cloneElement } from 'react';

import type { Maybe } from '../../types';

type ContextProviderComposerProps = PropsWithChildren<{
  providers: Array<Maybe<JSX.Element> | false>;
}>;

// https://frontendbyte.com/how-to-use-react-context-api-usereducer-hooks/
export default function ContextProviderComposer({
  children: initialChildren,
  providers
}: ContextProviderComposerProps) {
  return providers.reduceRight((children, parent) => {
    return parent ? cloneElement(parent, { children }) : children;
  }, initialChildren);
}
