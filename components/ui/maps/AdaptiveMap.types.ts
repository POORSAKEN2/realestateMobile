import type { StyleProp, ViewStyle } from "react-native";

import type { MapCoordinate, MapRegion } from "../../../types/maps";

export type AdaptiveMapPin = {
  id: string;
  coordinate: MapCoordinate;
  color?: string;
  description?: string;
  draggable?: boolean;
  title?: string;
};

export type AdaptiveMapProps = {
  onMapPress?: (coordinate: MapCoordinate) => void;
  onPinDragEnd?: (id: string, coordinate: MapCoordinate) => void;
  onPinPress?: (id: string) => void;
  pins: AdaptiveMapPin[];
  region: MapRegion;
  showsCompass?: boolean;
  showsScale?: boolean;
  style?: StyleProp<ViewStyle>;
  viewportRevision?: number;
};
