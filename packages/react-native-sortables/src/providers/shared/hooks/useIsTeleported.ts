import { useEffect, useState } from 'react';

import { usePortalContext } from '../PortalProvider';

export default function useIsTeleported(itemKey: string) {
  const { subscribe } = usePortalContext()!;
  const [isTeleported, setIsTeleported] = useState(false);

  useEffect(() => {
    return subscribe(itemKey, setIsTeleported);
  }, [itemKey, subscribe]);

  return isTeleported;
}
