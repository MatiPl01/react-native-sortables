import type { Dimensions } from 'react-native';

import { createGuardedContext } from './utils';

type MeasurementsContextType = {
  itemMeasurements: Record<string, Dimensions>;
  measureItem: (key: string, dimensions: Dimensions) => void;
};

const { MeasurementsContext, useMeasurementsContext } = createGuardedContext<MeasurementsContextType>()('MeasurementsContext');

export { useMeasurementsContext };

export default 