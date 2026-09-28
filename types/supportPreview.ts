import type { ComponentType } from "react";

export type SupportPreviewModule = {
  enabled: boolean;
  Screen: ComponentType<{ onClose: () => void }>;
};
