import { useInterDragContext } from '../InterDragProvider';

export default function useSortableData<I>(data: Array<I>) {
  const interDragProvider = useInterDragContext();

  if (!interDragProvider) {
    return data;
  }

  // TODO - add item if it changes owner
  return data;
}
