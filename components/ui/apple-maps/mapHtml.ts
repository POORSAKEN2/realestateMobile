export const APPLE_MAP_MESSAGE_SOURCE = "apple-map-webview";

type MapHtmlCoordinate = { lat: number; lng: number };

type MapHtmlPin = MapHtmlCoordinate & {
  id: string;
  title?: string;
  color?: string;
  draggable?: boolean;
  subtitle?: string;
};

type MapHtmlOptions = {
  center: MapHtmlCoordinate;
  latitudeDelta: number;
  longitudeDelta: number;
  pins: MapHtmlPin[];
  showsCompass: boolean;
  showsScale: boolean;
};

export function mapHtml({
  center,
  latitudeDelta,
  longitudeDelta,
  pins,
  showsCompass,
  showsScale,
}: MapHtmlOptions) {
  const configuration = JSON.stringify({
    center,
    latitudeDelta,
    longitudeDelta,
    pins,
    showsCompass,
    showsScale,
  }).replaceAll("<", "\\u003c");
  const messageSource = JSON.stringify(APPLE_MAP_MESSAGE_SOURCE);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    />
    <style>
      html, body, #map {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #f4f4f5;
      }
      #map {
        touch-action: none;
        -webkit-user-select: none;
      }
    </style>
  </head>
  <body>
    <div id="map" aria-label="Apple Maps location picker"></div>
    <script>
      (function () {
        var map;
        var markers = [];
        var authorizationCallbacks = [];
        var configuration = ${configuration};
        var messageSource = ${messageSource};

        function post(type, data) {
          if (!window.ReactNativeWebView) return;
          window.ReactNativeWebView.postMessage(JSON.stringify(
            Object.assign({ source: messageSource, type: type }, data || {})
          ));
        }

        function coordinate(value) {
          return new mapkit.Coordinate(Number(value.lat), Number(value.lng));
        }

        function requestAuthorization(done) {
          authorizationCallbacks.push(done);
          if (authorizationCallbacks.length === 1) post("token-request");
        }

        window.provideMapKitToken = function (token) {
          if (typeof token !== "string" || !token) return false;

          var callbacks = authorizationCallbacks.splice(0);
          callbacks.forEach(function (done) {
            done(token);
          });
          return callbacks.length > 0;
        };

        function postCoordinate(type, pin, nextCoordinate) {
          post(type, {
            id: pin.id,
            lat: nextCoordinate.latitude,
            lng: nextCoordinate.longitude
          });
        }

        window.setPins = function (pins) {
          if (!map) return false;
          if (markers.length) map.removeAnnotations(markers);
          markers = pins.map(function (pin) {
            var marker = new mapkit.MarkerAnnotation(coordinate(pin), {
              color: pin.color || "#8A77F4",
              data: { id: pin.id },
              draggable: Boolean(pin.draggable),
              subtitle: pin.subtitle || "",
              title: pin.title || "Location"
            });
            marker.addEventListener("select", function () {
              post("pin-press", { id: pin.id });
            });
            marker.addEventListener("drag-end", function () {
              postCoordinate("pin-drag-end", pin, marker.coordinate);
            });
            return marker;
          });
          if (markers.length) map.addAnnotations(markers);
          return true;
        };

        window.setRegion = function (view) {
          if (!map) return false;
          var region = new mapkit.CoordinateRegion(
            coordinate(view.center),
            new mapkit.CoordinateSpan(
              Number(view.latitudeDelta),
              Number(view.longitudeDelta)
            )
          );
          map.setRegionAnimated(region, true);
          return true;
        };

        function createMap() {
          if (map) return;

          map = new mapkit.Map("map", {
            center: coordinate(configuration.center),
            showsCompass: configuration.showsCompass
              ? mapkit.FeatureVisibility.Visible
              : mapkit.FeatureVisibility.Hidden,
            showsScale: configuration.showsScale
              ? mapkit.FeatureVisibility.Visible
              : mapkit.FeatureVisibility.Hidden
          });
          window.setRegion(configuration);
          window.setPins(configuration.pins || []);

          map.addEventListener("single-tap", function (event) {
            var nextCoordinate = map.convertPointOnPageToCoordinate(
              event.pointOnPage
            );
            post("map-press", {
              lat: nextCoordinate.latitude,
              lng: nextCoordinate.longitude
            });
          });
          map.addEventListener("region-change-end", function () {
            post("region-change", {
              lat: map.region.center.latitude,
              lng: map.region.center.longitude
            });
          });
          post("ready");
        }

        window.initMapKit = function (error) {
          if (error) {
            post("error", { message: "Apple Maps failed to load." });
            return;
          }

          mapkit.init({ authorizationCallback: requestAuthorization });
          mapkit.load("full-map").then(createMap).catch(function () {
            post("error", { message: "Apple Maps authorization failed." });
          });
        };

        window.addEventListener("error", function () {
          post("error", { message: "Apple Maps could not be loaded." });
        });
      })();
    </script>
    <script
      src="https://cdn.apple-mapkit.com/mk/6/mapkit.core.js"
      crossorigin
      async
      data-callback="initMapKit"
    ></script>
  </body>
</html>`;
}
