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
  const lastRevisionRef = useRef(viewportRevision);
  const lastRegionRef = useRef(region);

  useEffect(() => {
    const revisionChanged = lastRevisionRef.current !== viewportRevision;
    const regionChanged =
      lastRegionRef.current.latitude !== region.latitude ||
      lastRegionRef.current.longitude !== region.longitude ||
      lastRegionRef.current.latitudeDelta !== region.latitudeDelta ||
      lastRegionRef.current.longitudeDelta !== region.longitudeDelta;

    lastRevisionRef.current = viewportRevision;
    lastRegionRef.current = region;

    if (revisionChanged || (viewportRevision === 0 && regionChanged)) {
      mapRef.current?.animateToRegion(region, 500);
    }
  }, [
    region.latitude,
    region.longitude,
    region.latitudeDelta,
    region.longitudeDelta,
    viewportRevision,
    region,
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
