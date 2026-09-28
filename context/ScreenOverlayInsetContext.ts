import { createContext } from "react";

/** Bottom obstructions inside the screen's content coordinates. */
export const ScreenOverlayInsetContext = createContext({
  navigation: 0,
  safeArea: 0,
});
