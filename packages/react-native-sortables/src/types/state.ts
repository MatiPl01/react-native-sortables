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
