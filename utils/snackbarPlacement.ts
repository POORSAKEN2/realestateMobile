export type ScreenSnackbarPlacement = "above-navigation" | "screen-bottom";

/** Avoid double-counting safe areas already consumed by Screen. */
export function getSnackbarBottomOffset({
  navigationInset = 0,
  safeAreaInset = 0,
  bottomClearance = 0,
  placement = "above-navigation",
}: {
  navigationInset?: number;
  safeAreaInset?: number;
  bottomClearance?: number;
  placement?: ScreenSnackbarPlacement;
}) {
  return Math.max(
    24,
    Math.max(0, safeAreaInset) + 12,
    placement === "above-navigation" ? navigationInset : 0,
    bottomClearance > 0 ? bottomClearance + 12 : 0,
  );
}
