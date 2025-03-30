export enum DragActivationState {
  INACTIVE = 'INACTIVE',
  TOUCHED = 'TOUCHED',
  ACTIVE = 'ACTIVE'
}

export enum LayerState {
  IDLE = 0,
  INTERMEDIATE = 1,
  FOCUSED = 2
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
  PENDING = 1,

  /**
   * Intermediate state when the layout can be changed to absolute, but
   * measurements haven't been completed yet.
   */
  TRANSITION = 2,

  /**
   * Final state when the absolute layout can be applied, after all measurements
   * have been completed.
   */
  COMPLETE = 3
}
