export const MAPKIT_GEOCODER_MESSAGE_SOURCE = "mapkit-geocoder-webview";

export function mapKitGeocoderHtml() {
  const messageSource = JSON.stringify(MAPKIT_GEOCODER_MESSAGE_SOURCE);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
  </head>
  <body>
    <script>
      (function () {
        var authorizationCallbacks = [];
        var geocoder;
        var messageSource = ${messageSource};

        function post(type, data) {
          if (!window.ReactNativeWebView) return;
          window.ReactNativeWebView.postMessage(JSON.stringify(
            Object.assign({ source: messageSource, type: type }, data || {})
          ));
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

        function serializePlace(place, index) {
          var coordinate = place && place.coordinate;
          var latitude = Number(coordinate && coordinate.latitude);
          var longitude = Number(coordinate && coordinate.longitude);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return {
            id: String(place.id || latitude + ":" + longitude + ":" + index),
            label: place.formattedAddress || place.name || "Apple Maps location",
            latitude: latitude,
            longitude: longitude,
            city:
              place.locality ||
              place.subLocality ||
              place.administrativeArea ||
              undefined,
            country: place.country || undefined,
            countryCode: place.countryCode || undefined
          };
        }

        function serializePlaces(response) {
          return ((response && response.results) || [])
            .map(serializePlace)
            .filter(Boolean)
            .slice(0, 5);
        }

        window.searchLocations = function (requestId, query) {
          if (!geocoder) {
            post("request-error", {
              requestId: requestId,
              message: "Apple Maps geocoder is not ready."
            });
            return;
          }

          geocoder
            .lookup(query, { language: "en", limitToCountries: "PH" })
            .then(function (response) {
              post("search-success", {
                requestId: requestId,
                results: serializePlaces(response)
              });
            })
            .catch(function () {
              post("request-error", {
                requestId: requestId,
                message: "Apple Maps location search failed."
              });
            });
        };

        window.reverseGeocodeLocation = function (requestId, latitude, longitude) {
          if (!geocoder) {
            post("request-error", {
              requestId: requestId,
              message: "Apple Maps geocoder is not ready."
            });
            return;
          }

          geocoder
            .reverseLookup(
              { latitude: Number(latitude), longitude: Number(longitude) },
              { language: "en" }
            )
            .then(function (response) {
              var result = serializePlaces(response)[0] || {};
              post("reverse-success", {
                requestId: requestId,
                result: {
                  city: result.city,
                  country: result.country,
                  countryCode: result.countryCode,
                  label: result.label
                }
              });
            })
            .catch(function () {
              post("request-error", {
                requestId: requestId,
                message: "Apple Maps reverse geocoding failed."
              });
            });
        };

        window.initMapKitGeocoder = function (error) {
          if (error) {
            post("error", { message: "Apple Maps failed to load." });
            return;
          }

          mapkit.init({
            authorizationCallback: requestAuthorization,
            language: "en"
          });
          mapkit
            .load("services")
            .then(function () {
              geocoder = new mapkit.Geocoder({
                getsUserLocation: false,
                language: "en"
              });
              post("ready");
            })
            .catch(function () {
              post("error", { message: "Apple Maps geocoder failed to load." });
            });
        };

        window.addEventListener("error", function () {
          post("error", { message: "Apple Maps geocoder could not be loaded." });
        });
      })();
    </script>
    <script
      src="https://cdn.apple-mapkit.com/mk/6/mapkit.core.js"
      crossorigin
      async
      data-callback="initMapKitGeocoder"
    ></script>
  </body>
</html>`;
}
