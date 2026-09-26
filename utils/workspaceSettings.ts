import type {
  UpdateWorkspaceSettings,
  WorkspaceSettings,
  WorkspaceSettingsOptions,
  WorkspaceTheme,
} from "../types/domain/workspaceSettings";

export const WORKSPACE_SETTING_LABELS: Record<keyof WorkspaceSettings, string> = {
  appName: "Workspace name",
  currency: "Currency",
  locale: "Locale",
  dateFormat: "Date format",
  theme: "Theme",
  defaultDashboardLocation: "Dashboard location",
};

export const WORKSPACE_SETTING_KEYS = Object.keys(
  WORKSPACE_SETTING_LABELS,
) as (keyof WorkspaceSettings)[];

export function getWorkspaceSettingsChanges(
  saved: WorkspaceSettings,
  draft: WorkspaceSettings,
): UpdateWorkspaceSettings {
  return Object.fromEntries(
    WORKSPACE_SETTING_KEYS.filter((key) => saved[key] !== draft[key]).map(
      (key) => [key, draft[key]],
    ),
  ) as UpdateWorkspaceSettings;
}

export function validateWorkspaceSettings(
  draft: WorkspaceSettings,
  options: WorkspaceSettingsOptions,
) {
  const errors: Partial<Record<keyof WorkspaceSettings, string>> = {};
  const appNameLength = draft.appName.trim().length;
  if (appNameLength < 2 || appNameLength > 80)
    errors.appName = "Use 2 to 80 characters.";
  for (const [key, choices] of [
    ["currency", options.currencies],
    ["locale", options.locales],
    ["dateFormat", options.dateFormats],
    ["theme", options.themes],
    ["defaultDashboardLocation", options.locations],
  ] as const) {
    if (!choices.some((choice) => choice.value === draft[key]))
      errors[key] = "Select a supported option.";
  }
  return errors;
}

export function resolveWorkspaceTheme(
  theme: WorkspaceTheme,
  system: "light" | "dark" | null | undefined,
) {
  return theme === "system" ? (system === "dark" ? "dark" : "light") : theme;
}

export function resolveDashboardLocation<T>(
  personal: T | null | undefined,
  workspace: T,
) {
  return personal ?? workspace;
}
