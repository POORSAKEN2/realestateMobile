declare module "*.svg" {
  import React from "react";
  import type { SvgProps } from "react-native-svg";

  const SvgComponent: React.FC<SvgProps>;

  export default SvgComponent;
}
