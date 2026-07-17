import { useMemo } from "react";
import { Text, View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

type Coordinate = { latitude: number; longitude: number };

function createMapHtml({
  coordinate,
  mapsToken,
}: {
  coordinate?: Coordinate;
  mapsToken: string;
}) {
  const center = coordinate ?? { latitude: 12.8797, longitude: 121.774 };
  const delta = coordinate ? 0.02 : 12;

  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }</style>
    <script src="https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const initialCenter = ${JSON.stringify(center)};
      const initialDelta = ${JSON.stringify(delta)};
      const initialPin = ${JSON.stringify(coordinate ?? null)};

      mapkit.init({
        authorizationCallback: (done) => done(${JSON.stringify(mapsToken)}),
      });

      const map = new mapkit.Map("map");
      map.region = new mapkit.CoordinateRegion(
        new mapkit.Coordinate(initialCenter.latitude, initialCenter.longitude),
        new mapkit.CoordinateSpan(initialDelta, initialDelta),
      );

      let pin;
      function postPin(latitude, longitude) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "pin",
          latitude,
          longitude,
        }));
      }
      function setPin(latitude, longitude) {
        if (pin) map.removeAnnotation(pin);
        pin = new mapkit.MarkerAnnotation(
          new mapkit.Coordinate(latitude, longitude),
          { title: "Property location" },
        );
        map.addAnnotation(pin);
        postPin(latitude, longitude);
      }
      if (initialPin) {
        pin = new mapkit.MarkerAnnotation(
          new mapkit.Coordinate(initialPin.latitude, initialPin.longitude),
          { title: "Property location" },
        );
        map.addAnnotation(pin);
      }
      map.addEventListener("single-tap", (event) => {
        if (event.coordinate) setPin(event.coordinate.latitude, event.coordinate.longitude);
      });
    </script>
  </body>
</html>`;
}

export function MapKitJsWebView({
  coordinate,
  mapsToken,
  baseUrl,
  onPinSelected,
}: {
  coordinate?: Coordinate;
  mapsToken: string;
  baseUrl?: string;
  onPinSelected: (coordinate: Coordinate) => void;
}) {
  const html = useMemo(
    () => createMapHtml({ coordinate, mapsToken }),
    [coordinate, mapsToken],
  );

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        latitude?: number;
        longitude?: number;
      };
      if (
        message.type === "pin" &&
        typeof message.latitude === "number" &&
        typeof message.longitude === "number" &&
        Number.isFinite(message.latitude) &&
        Number.isFinite(message.longitude)
      ) {
        onPinSelected({
          latitude: message.latitude,
          longitude: message.longitude,
        });
      }
    } catch {
      // Ignore malformed bridge messages.
    }
  }

  if (!mapsToken) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EFF6FF] px-8">
        <Text className="text-center text-sm font-semibold text-[#1d1d1f]">
          Apple Maps setup is required on Android.
        </Text>
        <Text className="mt-2 text-center text-xs leading-5 text-[#6F6D6D]">
          Add EXPO_PUBLIC_MAPKIT_JS_TOKEN to enable this map.
        </Text>
      </View>
    );
  }

  return (
    <WebView
      domStorageEnabled
      javaScriptEnabled
      onMessage={handleMessage}
      originWhitelist={["*"]}
      source={{ html, baseUrl }}
      style={{ flex: 1 }}
    />
  );
}
