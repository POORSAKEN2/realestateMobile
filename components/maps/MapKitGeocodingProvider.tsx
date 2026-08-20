import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { useAppleMapsAuthorization } from "../../hooks/maps/useAppleMapsAuthorization";
import { useAuth } from "../../hooks/useAuth";
import {
  MAPKIT_GEOCODER_MESSAGE_SOURCE,
  mapKitGeocoderHtml,
} from "../../services/maps/mapKitGeocoderHtml";
import type {
  GeocodingClient,
  LocationSearchResult,
  ReverseGeocodeResult,
} from "../../types";

const REQUEST_TIMEOUT_MS = 20_000;
const READY_TIMEOUT_MS = 15_000;

type PendingRequest = {
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type ReadyWaiter = {
  reject: (error: Error) => void;
  resolve: () => void;
  timeout: ReturnType<typeof setTimeout>;
};

type MapKitGeocoderMessage = {
  source?: string;
  type?: string;
  requestId?: string;
  message?: string;
  result?: ReverseGeocodeResult;
  results?: LocationSearchResult[];
};

export const MapKitGeocodingContext = createContext<GeocodingClient | null>(
  null,
);

function parseMessage(value: string): MapKitGeocoderMessage | undefined {
  try {
    const message = JSON.parse(value) as MapKitGeocoderMessage;
    return message.source === MAPKIT_GEOCODER_MESSAGE_SOURCE
      ? message
      : undefined;
  } catch {
    return undefined;
  }
}

function createRequestId() {
  return `geocode-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function MapKitGeocodingProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const getAuthorizationToken = useAppleMapsAuthorization();
  const webViewRef = useRef<WebView | null>(null);
  const readyRef = useRef(false);
  const pendingRequestsRef = useRef(new Map<string, PendingRequest>());
  const readyWaitersRef = useRef(new Set<ReadyWaiter>());
  const source = useMemo(() => ({ html: mapKitGeocoderHtml() }), []);

  const rejectReadyWaiters = useCallback((error: Error) => {
    readyWaitersRef.current.forEach((waiter) => {
      clearTimeout(waiter.timeout);
      waiter.reject(error);
    });
    readyWaitersRef.current.clear();
  }, []);

  const resolveReadyWaiters = useCallback(() => {
    readyWaitersRef.current.forEach((waiter) => {
      clearTimeout(waiter.timeout);
      waiter.resolve();
    });
    readyWaitersRef.current.clear();
  }, []);

  const rejectPendingRequests = useCallback((error: Error) => {
    pendingRequestsRef.current.forEach((request) => {
      clearTimeout(request.timeout);
      request.reject(error);
    });
    pendingRequestsRef.current.clear();
  }, []);

  const waitUntilReady = useCallback(() => {
    if (Platform.OS === "web") {
      return Promise.reject(
        new Error("Apple Maps geocoding requires the iOS or Android app."),
      );
    }
    if (!isAuthenticated) {
      return Promise.reject(
        new Error("An authenticated session is required for Apple Maps."),
      );
    }
    if (readyRef.current) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const waiter: ReadyWaiter = {
        resolve,
        reject,
        timeout: setTimeout(() => {
          readyWaitersRef.current.delete(waiter);
          reject(new Error("Apple Maps geocoder did not become ready."));
        }, READY_TIMEOUT_MS),
      };
      readyWaitersRef.current.add(waiter);
    });
  }, [isAuthenticated]);

  const runRequest = useCallback(
    async <T,>(script: (requestId: string) => string) => {
      await waitUntilReady();

      const requestId = createRequestId();
      return new Promise<T>((resolve, reject) => {
        const request: PendingRequest = {
          resolve: (value) => resolve(value as T),
          reject,
          timeout: setTimeout(() => {
            pendingRequestsRef.current.delete(requestId);
            reject(new Error("Apple Maps geocoding request timed out."));
          }, REQUEST_TIMEOUT_MS),
        };
        pendingRequestsRef.current.set(requestId, request);

        const webView = webViewRef.current;
        if (!webView) {
          clearTimeout(request.timeout);
          pendingRequestsRef.current.delete(requestId);
          reject(new Error("Apple Maps geocoder is unavailable."));
          return;
        }

        webView.injectJavaScript(script(requestId));
      });
    },
    [waitUntilReady],
  );

  const searchLocations = useCallback(
    async (query: string) => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return [];

      return runRequest<LocationSearchResult[]>(
        (requestId) =>
          `window.searchLocations(${JSON.stringify(requestId)}, ${JSON.stringify(
            normalizedQuery,
          )}); true;`,
      );
    },
    [runRequest],
  );

  const reverseGeocodeLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return {};

      return runRequest<ReverseGeocodeResult>(
        (requestId) =>
          `window.reverseGeocodeLocation(${JSON.stringify(
            requestId,
          )}, ${latitude}, ${longitude}); true;`,
      );
    },
    [runRequest],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseMessage(event.nativeEvent.data);
      if (!message) return;

      if (message.type === "token-request") {
        void getAuthorizationToken()
          .then((token) => {
            webViewRef.current?.injectJavaScript(
              `window.provideMapKitToken(${JSON.stringify(token)}); true;`,
            );
          })
          .catch(() => {
            const error = new Error("Apple Maps authorization failed.");
            readyRef.current = false;
            rejectReadyWaiters(error);
            rejectPendingRequests(error);
          });
        return;
      }

      if (message.type === "ready") {
        readyRef.current = true;
        resolveReadyWaiters();
        return;
      }

      if (message.type === "error") {
        const error = new Error(
          message.message || "Apple Maps geocoder failed to load.",
        );
        readyRef.current = false;
        rejectReadyWaiters(error);
        rejectPendingRequests(error);
        return;
      }

      if (!message.requestId) return;
      const request = pendingRequestsRef.current.get(message.requestId);
      if (!request) return;

      clearTimeout(request.timeout);
      pendingRequestsRef.current.delete(message.requestId);

      if (message.type === "request-error") {
        request.reject(
          new Error(message.message || "Apple Maps geocoding failed."),
        );
      } else if (message.type === "search-success") {
        request.resolve(Array.isArray(message.results) ? message.results : []);
      } else if (message.type === "reverse-success") {
        request.resolve(message.result ?? {});
      }
    },
    [
      getAuthorizationToken,
      rejectPendingRequests,
      rejectReadyWaiters,
      resolveReadyWaiters,
    ],
  );

  useEffect(() => {
    if (isAuthenticated) return;

    const error = new Error("Apple Maps geocoding session ended.");
    readyRef.current = false;
    rejectReadyWaiters(error);
    rejectPendingRequests(error);
  }, [isAuthenticated, rejectPendingRequests, rejectReadyWaiters]);

  useEffect(
    () => () => {
      const error = new Error("Apple Maps geocoding provider was removed.");
      rejectReadyWaiters(error);
      rejectPendingRequests(error);
    },
    [rejectPendingRequests, rejectReadyWaiters],
  );

  const client = useMemo<GeocodingClient>(
    () => ({ searchLocations, reverseGeocodeLocation }),
    [reverseGeocodeLocation, searchLocations],
  );

  return (
    <MapKitGeocodingContext.Provider value={client}>
      {children}
      {isAuthenticated && Platform.OS !== "web" ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.bridgeContainer}
        >
          <WebView
            allowFileAccess={false}
            domStorageEnabled
            javaScriptEnabled
            onLoadStart={() => {
              readyRef.current = false;
            }}
            onMessage={handleMessage}
            originWhitelist={["*"]}
            ref={webViewRef}
            setSupportMultipleWindows={false}
            source={source}
          />
        </View>
      ) : null}
    </MapKitGeocodingContext.Provider>
  );
}

const styles = StyleSheet.create({
  bridgeContainer: {
    height: 1,
    left: -10,
    opacity: 0,
    overflow: "hidden",
    position: "absolute",
    top: -10,
    width: 1,
  },
});
