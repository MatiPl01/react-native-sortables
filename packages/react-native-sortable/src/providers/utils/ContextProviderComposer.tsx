import type { PropsWithChildren } from 'react';
import { cloneElement, memo } from 'react';

import type { Maybe } from '../../types';

type ContextProviderComposerProps = PropsWithChildren<{
  providers: Array<Maybe<JSX.Element> | false>;
}>;

// https://frontendbyte.com/how-to-use-react-context-api-usereducer-hooks/
function ContextProviderComposer({
  children: initialChildren,
  providers
}: ContextProviderComposerProps) {
  return providers.reduceRight((children, parent) => {
    return parent ? cloneElement(parent, { children }) : children;
  }, initialChildren);
}

export default memo(ContextProviderComposer);
