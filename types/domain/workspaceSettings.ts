export type WorkspaceTheme = "light" | "dark" | "system";

export type WorkspaceSettings = {
  appName: string;
  currency: string;
  locale: string;
  dateFormat: string;
  theme: WorkspaceTheme;
  defaultDashboardLocation: string;
};

export type WorkspaceSettingOption = { value: string; label: string };

export type WorkspaceLocationOption = WorkspaceSettingOption & {
  country: string;
  currency: string;
  locale: string;
  coordinates: { lat: number; lng: number };
  latitudeDelta: number;
  longitudeDelta: number;
};

export type WorkspaceSettingsOptions = {
  currencies: WorkspaceSettingOption[];
  locales: WorkspaceSettingOption[];
  dateFormats: WorkspaceSettingOption[];
  themes: WorkspaceSettingOption[];
  locations: WorkspaceLocationOption[];
};

export type WorkspaceSettingsResponse = {
  values: WorkspaceSettings;
  options: WorkspaceSettingsOptions;
};

export type EffectiveWorkspaceSettings = Omit<
  WorkspaceSettings,
  "defaultDashboardLocation"
> & {
  defaultDashboardLocation: WorkspaceLocationOption;
};

export type UpdateWorkspaceSettings = Partial<WorkspaceSettings>;
