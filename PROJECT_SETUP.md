REAL ESTATE PROJECT - LOCAL SETUP
=================================

Project layout
--------------
Frontend: /Users/[USER_NAME]/apps/realestateMobile
Backend:  /Users/[USER_NAME]/apps/realestate-be

Expected clone layout: both folders must be siblings under same parent folder.


1. PREREQUISITES
----------------

Install:

- Git
- Node.js LTS + npm
- PHP 8.3 or newer
- Composer 2
- PostgreSQL
- Native iOS: macOS, Xcode, Xcode command-line tools, CocoaPods
- Native Android: Android Studio, Android SDK, emulator, JDK 17

Check tools:

  node --version
  npm --version
  php --version
  composer --version
  psql --version


2. BACKEND SETUP - LARAVEL 13
-----------------------------

Open terminal:

  cd /Users/[USER_NAME]/apps/realestate-be
  composer install
  npm install

Environment:

Backend currently has no .env.example. Best path: request team development .env,
save it as:

  /Users/[USER_NAME]/apps/realestate-be/.env

Never commit .env.

Minimum local values should include:

  APP_NAME=RealEstate
  APP_ENV=local
  APP_KEY=
  APP_DEBUG=true
  APP_URL=http://127.0.0.1:8000

  DB_CONNECTION=pgsql
  DB_HOST=127.0.0.1
  DB_PORT=5432
  DB_DATABASE=realestate
  DB_USERNAME=<your-postgres-user>
  DB_PASSWORD=<your-postgres-password>

  SESSION_DRIVER=database
  CACHE_STORE=database
  QUEUE_CONNECTION=database
  FILESYSTEM_DISK=local
  PRIVATE_DISK_DRIVER=local
  MEDIA_DISK=private
  MAIL_MAILER=log
  FRONTEND_URL=http://localhost:8081

Create PostgreSQL database, then run:

  php artisan key:generate
  php artisan migrate
  php artisan storage:link

Optional demo data:

  php artisan db:seed --class=AdminSeeder

Demo login created by AdminSeeder:

  Email:    admin.acme@example.com
  Password: password

Important: do not use plain "php artisan db:seed" yet. Default DatabaseSeeder
references removed Lessee model. AdminSeeder matches current models.

Start backend, queue, logs, and Vite together:

  composer run dev

Backend API should listen at:

  http://127.0.0.1:8000/api

Quick check in another terminal:

  curl http://127.0.0.1:8000/api/public/listings

Expected: JSON response. HTML response usually means mobile API URL lacks /api.

Lightweight alternative, two terminals:

  # Terminal 1
  cd /Users/[USER_NAME]/apps/realestate-be
  php artisan serve --host=0.0.0.0 --port=8000

  # Terminal 2
  cd /Users/[USER_NAME]/apps/realestate-be
  php artisan queue:work


3. FRONTEND SETUP - EXPO / REACT NATIVE
----------------------------------------

Open new terminal:

  cd /Users/[USER_NAME]/apps/realestateMobile
  npm ci

Create local environment from tracked template:

  cp .env.example .env

Set API URL in .env. Choose target:

  Web or iOS Simulator:
  VITE_API_BASE_URL=http://127.0.0.1:8000/api
  EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api

  Android Emulator:
  VITE_API_BASE_URL=http://10.0.2.2:8000/api
  EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api

  Physical phone:
  VITE_API_BASE_URL=http://<computer-LAN-IP>:8000/api
  EXPO_PUBLIC_API_BASE_URL=http://<computer-LAN-IP>:8000/api

Physical phone rules:

- Phone and computer use same Wi-Fi.
- Backend starts with --host=0.0.0.0.
- Firewall allows ports 8000 and 8081.
- Do not use localhost or 127.0.0.1; those point to phone itself.
- On macOS, find Wi-Fi IP with: ipconfig getifaddr en0

Optional environment values:

  EXPO_PROJECT_ID=<Expo-project-ID>
  GOOGLE_MAPS_API_KEY=<Android-Google-Maps-key>
  EXPO_PUBLIC_GEOCODING_BASE_URL=https://nominatim.openstreetmap.org

Google Maps key needed for Android native map builds. Keep secret values out of Git.

Known dependency mismatch:

Expo check currently flags expo-device, expo-document-picker, expo-image-picker,
and expo-notifications as incompatible with installed Expo SDK 54. Repair once:

  npx expo install expo-device expo-document-picker expo-image-picker expo-notifications
  npx expo install --check

Then start clean:

  npx expo start -c

From Expo terminal:

- Press w: web
- Press i: iOS Simulator
- Press a: Android Emulator
- Scan QR: physical device

Direct commands:

  npm run web
  npm run ios
  npm run android

Native commands build local development app. First build can take several minutes.
Android remote push notifications need development build; Expo Go skips registration.


4. NORMAL DAILY START
---------------------

Terminal 1:

  cd /Users/[USER_NAME]/apps/realestate-be
  composer run dev

Terminal 2:

  cd /Users/[USER_NAME]/apps/realestateMobile
  npx expo start


5. COMMON FAILURES
------------------

"Network Error" or request timeout:

- Confirm backend runs.
- Confirm URL ends with /api.
- Use 10.0.2.2 on Android Emulator.
- Use computer LAN IP on physical phone.
- Restart Expo after changing .env: npx expo start -c

Laravel database error:

- Confirm PostgreSQL runs.
- Recheck DB_* values.
- Confirm database exists.
- Run: php artisan migrate:status

Laravel storage upload error:

  php artisan storage:link

Queued email/TOTP not processed:

  php artisan queue:work

Stale Laravel config after .env edit:

  php artisan optimize:clear

Expo package/version error:

  npx expo install --check

TypeScript check:

  npx tsc --noEmit


6. VERIFIED FROM CURRENT WORKSPACE
----------------------------------

- Frontend TypeScript check passes.
- Backend reports Laravel Framework 13.19.0.
- Backend requires PHP ^8.3.
- Frontend uses Expo SDK 54 and React Native 0.81.5.
- API default is http://localhost:8000/api.
- Backend local configuration uses PostgreSQL on port 5432.
