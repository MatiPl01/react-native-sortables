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

export enum AbsoluteLayoutState {
  /**
   * Initial state when the layout is relative. This occurs before sorting
   * is enabled for the first time and any measurements have been made.
   */
  PENDING,

  /**
   * Intermediate state when the layout can be changed to absolute, but
   * measurements haven't been completed yet.
   */
  TRANSITION,

  /**
   * Final state when the absolute layout can be applied, after all measurements
   * have been completed.
   */
  COMPLETE
}

export enum ItemPortalState {
  /**
   * Initial state when there is no portal or the item is rendered
   * in its original position (not teleported).
   */
  IDLE,

  /**
   * Intermediate state when item teleportation has been scheduled
   * but not completed yet. Represents the transition from IDLE to
   * TELEPORTED state.
   */
  TELEPORTING,

  /**
   * State when the item is fully rendered within the portal outlet
   * at its destination position.
   */
  TELEPORTED,

  /**
   * Intermediate state when the item is being removed from the portal
   * outlet but the removal is not complete yet. Represents the
   * transition from TELEPORTED back to IDLE state.
   */
  EXITING
}
