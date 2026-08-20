const FLOOR_AREA_COLORS = [
  "#634CE4",
  "#0D9488",
  "#E11D48",
  "#D97706",
  "#2563EB",
  "#7C3AED",
] as const;

export function getFloorAreaColor(index: number) {
  return FLOOR_AREA_COLORS[index % FLOOR_AREA_COLORS.length];
}
