export enum DragActivationState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TOUCHED = 'TOUCHED'
}

export enum LayerState {
  Focused = 2,
  Idle = 0,
  Intermediate = 1
}

/**
 * Represents the state of absolute positioning layout in sortable components.
 * @enum {number}
 */
export enum AbsoluteLayoutState {
  /**
   * Initial state when the layout is relative. This occurs before sorting
   * is enabled for the first time and any measurements have been made.
   */
  Pending = 1,

  /**
   * Intermediate state when the layout can be changed to absolute, but
   * measurements haven't been completed yet.
   */
  Transition = 2,

  /**
   * Final state when the absolute layout can be applied, after all measurements
   * have been completed.
   */
  Complete = 3
}
