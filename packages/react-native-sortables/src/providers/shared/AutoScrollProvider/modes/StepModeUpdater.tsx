import type { AutoScrollStepModeSettings } from '../../../../types';
import { error } from '../../../../utils';

// TODO - implement in a separate PR
export default function StepModeUpdater(
  _props: Omit<AutoScrollStepModeSettings, 'autoScrollMode'>
) {
  throw error('Step mode is not implemented yet');
}
