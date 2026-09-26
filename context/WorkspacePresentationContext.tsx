import { StatusBar } from "expo-status-bar";
import { vars } from "nativewind";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useColorScheme, View } from "react-native";

import { darkColors, lightColors, setActiveColors } from "../constants/colors";
import { DEFAULT_LOCATION_OPTIONS } from "../constants/defaultLocation";
import { useEffectiveWorkspaceSettings } from "../hooks/api/useWorkspaceSettings";
import type { WorkspaceSettings } from "../types/domain/workspaceSettings";
import type { WorkspaceLocationOption } from "../types/domain/workspaceSettings";
import { setPresentationSettings } from "../utils/formatters";
import { resolveWorkspaceTheme } from "../utils/workspaceSettings";

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  appName: "Terrane",
  currency: "PHP",
  locale: "en-PH",
  dateFormat: "MM/DD/YYYY",
  theme: "system",
  defaultDashboardLocation: "philippines",
};

type WorkspacePresentation = {
  settings: WorkspaceSettings;
  resolvedTheme: "light" | "dark";
  workspaceLocation: (typeof DEFAULT_LOCATION_OPTIONS)[number];
};

const WorkspacePresentationContext = createContext<
  WorkspacePresentation | undefined
>(undefined);

function rgb(hex: string) {
  const value = hex.replace("#", "");
  return `${parseInt(value.slice(0, 2), 16)} ${parseInt(value.slice(2, 4), 16)} ${parseInt(value.slice(4, 6), 16)}`;
}

export function WorkspacePresentationProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const query = useEffectiveWorkspaceSettings();
  const effective = query.data;
  const settings: WorkspaceSettings = effective
    ? {
        ...effective,
        defaultDashboardLocation: effective.defaultDashboardLocation.value,
      }
    : DEFAULT_WORKSPACE_SETTINGS;
  const resolvedTheme = resolveWorkspaceTheme(settings.theme, systemTheme);
  const palette = resolvedTheme === "dark" ? darkColors : lightColors;
  setActiveColors(resolvedTheme);
  setPresentationSettings(settings);
  const workspaceLocation = effective
    ? toDefaultLocation(effective.defaultDashboardLocation)
    : DEFAULT_LOCATION_OPTIONS.find(
        (location) => location.id === "philippines",
      )!;
  const style = vars({
    "--color-primary": rgb(palette.primary),
    "--color-secondary": rgb(palette.secondary),
    "--color-accent": rgb(palette.accent),
    "--color-surface": rgb(palette.surface),
    "--color-text": rgb(palette.text),
    "--color-panel": rgb(palette.panel),
    "--color-description": rgb(palette.description),
    "--color-muted": rgb(palette.muted),
    "--color-danger": rgb(palette.danger),
    "--color-danger-surface": rgb(palette.dangerSurface),
    "--color-success": rgb(palette.success),
    "--color-success-surface": rgb(palette.successSurface),
    "--color-warning": rgb(palette.warning),
    "--color-warning-surface": rgb(palette.warningSurface),
    "--color-turnover": rgb(palette.turnover),
    "--color-info": rgb(palette.info),
    "--color-info-surface": rgb(palette.infoSurface),
  });
  const value = useMemo(
    () => ({ settings, resolvedTheme, workspaceLocation }),
    [resolvedTheme, settings, workspaceLocation],
  );
  return (
    <WorkspacePresentationContext.Provider value={value}>
      <View className="flex-1 bg-surface" style={style}>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        {children}
      </View>
    </WorkspacePresentationContext.Provider>
  );
}

function toDefaultLocation(location: WorkspaceLocationOption) {
  return {
    id: location.value,
    label: location.label,
    country: location.country,
    coordinates: location.coordinates,
    latitudeDelta: location.latitudeDelta,
    longitudeDelta: location.longitudeDelta,
  };
}

export function useWorkspacePresentation() {
  const value = useContext(WorkspacePresentationContext);
  if (!value)
    throw new Error(
      "useWorkspacePresentation must be used inside WorkspacePresentationProvider",
    );
  return value;
}

export function useThemeColors() {
  const { resolvedTheme } = useWorkspacePresentation();

  return resolvedTheme === "dark" ? darkColors : lightColors;
}
