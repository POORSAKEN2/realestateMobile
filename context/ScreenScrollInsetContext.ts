import { createContext, useContext, useMemo } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

export const ScreenScrollInsetContext = createContext(0);

/** Add clearance after the last row without reducing the scroll viewport. */
export function useScreenScrollContentStyle(style?: StyleProp<ViewStyle>) {
  const bottomInset = useContext(ScreenScrollInsetContext);

  return useMemo(() => {
    if (!bottomInset) return style;

    const resolved = StyleSheet.flatten(style);
    const bottomPadding =
      resolved?.paddingBottom ??
      resolved?.paddingVertical ??
      resolved?.padding ??
      0;

    return [
      style,
      {
        paddingBottom:
          bottomInset + (typeof bottomPadding === "number" ? bottomPadding : 0),
      },
    ];
  }, [bottomInset, style]);
}
