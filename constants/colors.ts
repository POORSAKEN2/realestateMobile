export const lightColors = {
  primary: "#8A77F4",
  secondary: "#8b62f3",
  accent: "#BEE3DB",
  surface: "#FAF9F9",
  text: "#1E1F45",
  panel: "#FFFFFF",
  whitePrimary: "#FFFFFF",
  description: "#6F6D6D",
  muted: "#94A3B8",
  black: "#1E1F45",
  danger: "#B42318",
  dangerSurface: "#FEF3F2",
  success: "#0F6B55",
  successSurface: "#BEE3DB",
  warning: "#805000",
  warningSurface: "#FFF6DD",
  turnover: "#B7791F",
  info: "#2563EB",
  infoSurface: "#EFF6FF",
} as const;

export const darkColors: Record<keyof typeof lightColors, string> = {
  primary: "#8A77F4",
  secondary: "#A99BFF",
  accent: "#214A43",
  surface: "#10111A",
  text: "#F4F1FF",
  panel: "#1A1C28",
  whitePrimary: "#FFFFFF",
  description: "#B8B5C5",
  muted: "#8F96A8",
  black: "#F4F1FF",
  danger: "#FF8A80",
  dangerSurface: "#3A1D20",
  success: "#71D7BC",
  successSurface: "#173C34",
  warning: "#FFD078",
  warningSurface: "#382E16",
  turnover: "#F0B95F",
  info: "#8DB8FF",
  infoSurface: "#172A4A",
};

let activeColors: Record<keyof typeof lightColors, string> = lightColors;

export function setActiveColors(theme: "light" | "dark") {
  activeColors = theme === "dark" ? darkColors : lightColors;
}

export const colors = (
  Object.keys(lightColors) as (keyof typeof lightColors)[]
).reduce(
  (result, key) =>
    Object.defineProperty(result, key, {
      enumerable: true,
      get: () => activeColors[key],
    }),
  {} as Record<keyof typeof lightColors, string>,
);
