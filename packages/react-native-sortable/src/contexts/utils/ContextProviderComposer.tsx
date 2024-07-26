import type { PropsWithChildren } from 'react';
import { cloneElement, memo } from 'react';

type ContextProviderComposerProps = PropsWithChildren<{
  providers: Array<JSX.Element | undefined>;
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
