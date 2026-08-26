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
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { useAppleMapsAuthorization } from "../../../hooks/maps/useAppleMapsAuthorization";
import { SkeletonBlock, SkeletonGroup } from "../Skeleton";
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
  const getAuthorizationToken = useAppleMapsAuthorization();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [webViewRevision, setWebViewRevision] = useState(0);
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

  if (!sourceRef.current) {
    sourceRef.current = {
      html: mapHtml({
        center,
        latitudeDelta,
        longitudeDelta,
        pins,
        showsCompass,
        showsScale,
      }),
    };
  }

  const provideMapKitToken = useCallback(
    async (forceRefresh = false) => {
      setError("");

      try {
        const token = await getAuthorizationToken(forceRefresh);
        const serializedToken = JSON.stringify(token).replaceAll(
          "<",
          "\\u003c",
        );
        ref.current?.injectJavaScript(
          `window.provideMapKitToken(${serializedToken}); true;`,
        );
      } catch {
        setReady(false);
        setError("Apple Maps authorization failed.");
      }
    },
    [getAuthorizationToken],
  );

  const retryMap = useCallback(async () => {
    setError("");
    setReady(false);

    try {
      await getAuthorizationToken(true);
      setWebViewRevision((revision) => revision + 1);
    } catch {
      setError("Apple Maps authorization failed. Please try again.");
    }
  }, [getAuthorizationToken]);

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

      if (message.type === "token-request") {
        void provideMapKitToken();
        return;
      }
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
    [onMapPress, onPinDragEnd, onPinPress, onRegionChange, provideMapKitToken],
  );

  return (
    <View style={styles.container}>
      <MapWebView
        allowFileAccess={false}
        androidLayerType="hardware"
        bounces={false}
        domStorageEnabled
        javaScriptEnabled
        key={webViewRevision}
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
        source={sourceRef.current as AppleMapSource}
        style={styles.webView}
      />
      {!ready && !error ? (
        <View pointerEvents="none" style={styles.loading}>
          <SkeletonGroup
            accessibilityLabel="Loading map"
            className="w-full items-center px-8"
          >
            <SkeletonBlock className="h-16 w-16 rounded-full bg-primary/20" />
            <View className="mt-4 w-full max-w-64 rounded-3xl bg-white p-4">
              <SkeletonBlock className="h-4 w-2/3 bg-primary/20" />
              <SkeletonBlock className="mt-3 h-3 w-full" />
              <SkeletonBlock className="mt-2 h-3 w-3/4" />
            </View>
          </SkeletonGroup>
        </View>
      ) : null}
      {error ? (
        <View style={styles.fallback}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void retryMap()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F9" },
  webView: { flex: 1, backgroundColor: "#FAF9F9" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FAF9F9",
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FAF9F9",
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#8A77F4",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
