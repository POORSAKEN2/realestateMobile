export const MODAL_OVERLAY_CLASS_NAME = "bg-textPrimary/40";

const MODAL_SHEET_HEIGHT_RATIO = 0.64;
const MODAL_SHEET_MIN_HEIGHT = 360;
const MODAL_SHEET_MAX_HEIGHT = 640;
const MODAL_SHEET_TOP_GUTTER = 24;

export function getStandardModalSheetHeight(viewportHeight: number) {
  return Math.min(
    Math.max(viewportHeight * MODAL_SHEET_HEIGHT_RATIO, MODAL_SHEET_MIN_HEIGHT),
    MODAL_SHEET_MAX_HEIGHT,
    Math.max(viewportHeight - MODAL_SHEET_TOP_GUTTER, 0),
  );
}
