import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { APPLE_MAP_MESSAGE_SOURCE, mapHtml } from "./mapHtml";

export type AppleMapCoordinate = { lat: number; lng: number };

export type AppleMapPin = AppleMapCoordinate & {
  id: string;
  title?: string;
  color?: string;
  draggable?: boolean;
  subtitle?: string;
};

type AppleMapProps = {
  center: AppleMapCoordinate;
  latitudeDelta: number;
  longitudeDelta: number;
  pins: AppleMapPin[];
  onMapPress?: (coordinate: AppleMapCoordinate) => void;
  onPinDragEnd?: (id: string, coordinate: AppleMapCoordinate) => void;
  onPinPress?: (id: string) => void;
  onRegionChange?: (coordinate: AppleMapCoordinate) => void;
  showsCompass?: boolean;
  showsScale?: boolean;
  viewportRevision?: number;
};

type AppleMapSource = { html: string; baseUrl?: string };

type AppleMapMessage = {
  source?: string;
  type?: string;
  id?: string;
  lat?: number;
  lng?: number;
  message?: string;
};

type WebViewHandle = { injectJavaScript: (script: string) => void };

type MapWebViewProps = {
  allowFileAccess?: boolean;
  androidLayerType?: "none" | "software" | "hardware";
  bounces?: boolean;
  domStorageEnabled?: boolean;
  javaScriptEnabled?: boolean;
  nestedScrollEnabled?: boolean;
  onError?: () => void;
  onMessage?: (event: WebViewMessageEvent) => void;
  originWhitelist?: string[];
  scrollEnabled?: boolean;
  setSupportMultipleWindows?: boolean;
  source: { html: string; baseUrl?: string };
  style?: StyleProp<ViewStyle>;
};

// Public WebView types intersect incompatible platform prop definitions.
// Narrow this component to props used here.
const MapWebView = WebView as unknown as ForwardRefExoticComponent<
  MapWebViewProps & RefAttributes<WebViewHandle>
>;

const MAPKIT_JS_TOKEN = process.env.EXPO_PUBLIC_MAPKIT_JS_TOKEN?.trim() ?? "";
const MAPKIT_PAGE_URL = process.env.EXPO_PUBLIC_MAPKIT_PAGE_URL?.trim();

function parseMessage(value: string): AppleMapMessage | undefined {
  try {
    const message = JSON.parse(value) as AppleMapMessage;
    return message.source === APPLE_MAP_MESSAGE_SOURCE ? message : undefined;
  } catch {
    return undefined;
  }
}

function getCoordinate(message: AppleMapMessage) {
  return Number.isFinite(message.lat) && Number.isFinite(message.lng)
    ? { lat: message.lat as number, lng: message.lng as number }
    : undefined;
}

export function AppleMap({
  center,
  latitudeDelta,
  longitudeDelta,
  pins,
  onMapPress,
  onPinDragEnd,
  onPinPress,
  onRegionChange,
  showsCompass = false,
  showsScale = false,
  viewportRevision = 0,
}: AppleMapProps) {
  const ref = useRef<WebViewHandle | null>(null);
  const sourceRef = useRef<AppleMapSource | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(
    MAPKIT_JS_TOKEN
      ? ""
      : "Add EXPO_PUBLIC_MAPKIT_JS_TOKEN to load Apple Maps.",
  );
  const serializedPins = useMemo(
    () => JSON.stringify(pins).replaceAll("<", "\\u003c"),
    [pins],
  );
  const serializedRegion = useMemo(
    () =>
      JSON.stringify({ center, latitudeDelta, longitudeDelta }).replaceAll(
        "<",
        "\\u003c",
      ),
    [center.lat, center.lng, latitudeDelta, longitudeDelta],
  );
  const regionKey = `${viewportRevision}:${serializedRegion}`;
  const lastPinsRef = useRef(serializedPins);
  const lastRegionKeyRef = useRef(regionKey);

  if (MAPKIT_JS_TOKEN && !sourceRef.current) {
    sourceRef.current = {
      html: mapHtml({
        center,
        latitudeDelta,
        longitudeDelta,
        pins,
        showsCompass,
        showsScale,
        token: MAPKIT_JS_TOKEN,
      }),
      ...(MAPKIT_PAGE_URL ? { baseUrl: MAPKIT_PAGE_URL } : {}),
    };
  }

  useEffect(() => {
    if (!ready || lastPinsRef.current === serializedPins) return;
    lastPinsRef.current = serializedPins;
    ref.current?.injectJavaScript(`window.setPins(${serializedPins}); true;`);
  }, [ready, serializedPins]);

  useEffect(() => {
    if (!ready || lastRegionKeyRef.current === regionKey) return;
    lastRegionKeyRef.current = regionKey;
    ref.current?.injectJavaScript(
      `window.setRegion(${serializedRegion}); true;`,
    );
  }, [ready, regionKey, serializedRegion]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseMessage(event.nativeEvent.data);
      if (!message) return;

      if (message.type === "ready") {
        setError("");
        setReady(true);
        return;
      }
      if (message.type === "error") {
        setReady(false);
        setError(message.message ?? "Apple Maps could not be loaded.");
        return;
      }

      const coordinate = getCoordinate(message);
      if (message.type === "map-press" && coordinate) onMapPress?.(coordinate);
      if (message.type === "region-change" && coordinate)
        onRegionChange?.(coordinate);
      if (message.type === "pin-press" && message.id) onPinPress?.(message.id);
      if (message.type === "pin-drag-end" && message.id && coordinate)
        onPinDragEnd?.(message.id, coordinate);
    },
    [onMapPress, onPinDragEnd, onPinPress, onRegionChange],
  );

  if (!MAPKIT_JS_TOKEN || !sourceRef.current) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapWebView
        allowFileAccess={false}
        androidLayerType="hardware"
        bounces={false}
        domStorageEnabled
        javaScriptEnabled
        nestedScrollEnabled
        onError={() => {
          setReady(false);
          setError("Apple Maps could not be loaded.");
        }}
        onMessage={handleMessage}
        originWhitelist={["*"]}
        ref={ref}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        source={sourceRef.current}
        style={styles.webView}
      />
      {!ready && !error ? (
        <View pointerEvents="none" style={styles.loading}>
          <ActivityIndicator color="#634CE4" size="large" />
          <Text style={styles.loadingText}>Loading Apple Maps...</Text>
        </View>
      ) : null}
      {error ? (
        <View pointerEvents="none" style={styles.fallback}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  webView: { flex: 1, backgroundColor: "#F4F4F5" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#F4F4F5",
  },
  loadingText: { color: "#6F6D6D", fontSize: 13, fontWeight: "600" },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F4F4F5",
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
