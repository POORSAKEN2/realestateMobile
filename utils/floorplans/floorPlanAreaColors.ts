import { colors } from "../../constants/colors";

const FLOOR_AREA_COLORS = [
  colors.secondary,
  colors.success,
  colors.danger,
  colors.warning,
  colors.info,
  colors.primary,
] as const;

export function getFloorAreaColor(index: number) {
  return FLOOR_AREA_COLORS[index % FLOOR_AREA_COLORS.length];
}
