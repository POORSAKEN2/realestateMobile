import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { MapCoordinate } from "../../../types/maps";
import { AppleMap, type AppleMapCoordinate } from "../apple-maps/AppleMap";
import type { AdaptiveMapProps } from "./AdaptiveMap.types";

export type { AdaptiveMapPin, AdaptiveMapProps } from "./AdaptiveMap.types";

function toMapCoordinate({ lat, lng }: AppleMapCoordinate): MapCoordinate {
  return { latitude: lat, longitude: lng };
}

export const AdaptiveMap = memo(function AdaptiveMap({
  onMapPress,
  onPinDragEnd,
  onPinPress,
  pins,
  region,
  showsCompass = false,
  showsScale = false,
  style,
  viewportRevision = 0,
}: AdaptiveMapProps) {
  const appleMapPins = useMemo(
    () =>
      pins.map((pin) => ({
        id: pin.id,
        lat: pin.coordinate.latitude,
        lng: pin.coordinate.longitude,
        color: pin.color,
        draggable: pin.draggable,
        subtitle: pin.description,
        title: pin.title,
      })),
    [pins],
  );

  return (
    <View style={[styles.container, style]}>
      <AppleMap
        center={{ lat: region.latitude, lng: region.longitude }}
        latitudeDelta={region.latitudeDelta}
        longitudeDelta={region.longitudeDelta}
        onMapPress={
          onMapPress
            ? (coordinate) => onMapPress(toMapCoordinate(coordinate))
            : undefined
        }
        onPinDragEnd={
          onPinDragEnd
            ? (id, coordinate) => onPinDragEnd(id, toMapCoordinate(coordinate))
            : undefined
        }
        onPinPress={onPinPress}
        pins={appleMapPins}
        showsCompass={showsCompass}
        showsScale={showsScale}
        viewportRevision={viewportRevision}
      />
    </View>
  );
});

const styles = StyleSheet.create({ container: { flex: 1 } });
