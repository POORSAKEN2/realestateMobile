import { useContext } from "react";

import { DefaultLocationContext } from "../context/DefaultLocationContext";

export function useDefaultLocation() {
  const context = useContext(DefaultLocationContext);

  if (!context) {
    throw new Error(
      "useDefaultLocation must be used within a DefaultLocationProvider",
    );
  }

  return context;
}
