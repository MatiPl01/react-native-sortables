import { error } from '../../../../utils';
import { usePortalContext } from '../../PortalProvider';
import { useMultiZoneContext } from '..';

export default function useZoneContext() {
  const multiZoneContext = useMultiZoneContext();
  const portalContext = usePortalContext();

  if (!multiZoneContext || !portalContext) {
    throw error(
      'Zones must be used within a Sortable.MultiZoneProvider component'
    );
  }

  return {
    ...multiZoneContext,
    ...portalContext
  };
}
