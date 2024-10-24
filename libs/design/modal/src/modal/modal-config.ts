export interface DaffModalConfiguration {
  /**
   * A hook for what to do when the backdrop behind a
   * DaffModalComponent is interacted with.
   */
  onBackdropClicked?: () => void;

  /** Sets the `aria-labelledby` property on the modal */
  ariaLabelledBy?: string;
}
