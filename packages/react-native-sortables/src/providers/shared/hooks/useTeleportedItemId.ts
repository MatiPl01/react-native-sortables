import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useTeleportedItemId(itemKey: string) {
  const { componentId } = useCommonValuesContext();

  return `${componentId}-${itemKey}`;
}
