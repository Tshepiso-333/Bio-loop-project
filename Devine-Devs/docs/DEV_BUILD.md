# Running the app as a development build (required for the driver map)

**Why:** the driver map uses MapLibre (`@maplibre/maplibre-react-native`), which is
native code that is *not* inside Expo Go. In Expo Go the map is blank. A
development build is "your own Expo Go" with MapLibre compiled in — you build it
once per machine, then it hot-reloads exactly like Expo Go.

The other three roles don't use the map, but one build for everyone is simplest.

## One-time setup (per computer) — ~15 min the first time

1. **JDK 17** — `winget install EclipseAdoptium.Temurin.17.JDK` (Windows) or
   `brew install --cask temurin@17` (Mac). Set `JAVA_HOME` to it.
2. **Android SDK** — easiest via Android Studio (SDK Manager → install a platform
   + build-tools + an emulator image), or point `ANDROID_HOME` at an existing SDK.
3. A device: an Android phone with USB debugging on, or an emulator.

## Build + run

```
cd Devine-Devs
npm install
npx expo run:android        # generates android/, compiles, installs, starts Metro
```

First run: 10–20 min (downloads Gradle + NDK, compiles MapLibre). After that,
`npx expo run:android` only rebuilds when a *native* dependency changed; for
day-to-day work just start Metro and open the installed app:

```
npx expo start --dev-client
```

## Rules

- `android/` and `ios/` are **generated** (`npx expo prebuild`) and gitignored.
  Never commit them; never hand-edit them — change `app.json` instead.
- If a native dependency is added/removed/upgraded, everyone runs
  `npx expo run:android` again.
- iPhone: needs a Mac + Xcode (`npx expo run:ios`). Expo Go on iPhone still
  works for every screen except the driver map.

## Map + routing stack (no Google)

- Map tiles: OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) — free, no key.
- Routing: openrouteservice via the `optimize-route` Edge Function — the API key
  lives only in the Supabase secret `ORS_API_KEY`, never in the app.
- A minimal working reference (map + route line) lives outside the repo at
  `Desktop/thobile-test/map-route-test/App.js` for diffing against `DriverMapScreen.js`.

## Low-RAM machines (8 GB): trim the native build

`android/` is generated and gitignored, so after `npx expo prebuild` (or the first
`npx expo run:android`) edit `android/gradle.properties`:

```
org.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m
reactNativeArchitectures=x86_64,arm64-v8a
```

Two ABIs (emulator + real phones) instead of four halves the MapLibre/Reanimated
native compile and keeps it from being killed for memory. If a build was
interrupted and Reanimated complains `build.ninja still dirty`, delete
`node_modules/react-native-reanimated/android/.cxx` and rebuild.
