import { memo, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

import type { AdaptiveMapProps } from "./AdaptiveMap.types";

export type { AdaptiveMapPin, AdaptiveMapProps } from "./AdaptiveMap.types";

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
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 500);
  }, [
    region.latitude,
    region.longitude,
    region.latitudeDelta,
    region.longitudeDelta,
    viewportRevision,
  ]);

  return (
    <MapView
      initialRegion={region}
      onPress={(event) => onMapPress?.(event.nativeEvent.coordinate)}
      ref={mapRef}
      showsCompass={showsCompass}
      showsScale={showsScale}
      style={[styles.container, style]}
    >
      {pins.map((pin) => (
        <Marker
          coordinate={pin.coordinate}
          description={pin.description}
          draggable={pin.draggable}
          identifier={pin.id}
          key={pin.id}
          onDragEnd={(event) =>
            onPinDragEnd?.(pin.id, event.nativeEvent.coordinate)
          }
          onPress={(event) => {
            event.stopPropagation();
            onPinPress?.(pin.id);
          }}
          pinColor={pin.color}
          title={pin.title}
        />
      ))}
    </MapView>
  );
});

const styles = StyleSheet.create({ container: { flex: 1 } });
