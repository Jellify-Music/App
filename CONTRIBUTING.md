# Contributing

## Table of Contents

- [Getting Started](#getting-started)
- [Running Locally](#️running-locally)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)

## Getting Started

1. Fork this repository
2. Follow the instructions for [Running Locally](#️running-locally)
3. Check out the [issues](https://github.com/Jellify-Music/App/issues) if you need inspiration
4. Hack, hack, hack
5. Submit a Pull Request to sync the main repository with your fork

## Running Locally

### Universal Dependencies

- [Node.js v22](https://nodejs.org/en/download)
- [Bun](https://bun.sh/) for managing dependencies

### 🍎 iOS

#### Dependencies

- [Xcode](https://developer.apple.com/xcode/) for building

#### Setup

- Clone this repository
- Run `bun init-ios` to initialize the project
  - This will install `npm` packages, install `bundler` and required gems, and install required CocoaPods with [React Native's New Architecture](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here#what-is-the-new-architecture)

#### Running

- Run `bun start` to start the Metro dev server
- Open `Jellify.xcworkspace` with Xcode, _not_ `Jellify.xcodeproj`
- Run in the simulator
  - _You will need to wait for Xcode to finish its "Indexing" step before the build completes_

- To run on a physical device, you will need access to the _Signing_ repository
  - Create a GitHub Personal Access Token and export it as `MATCH_REPO_PAT`
  - Run `bun fastlane:ios:match` to fetch the signing keys and certificates

#### Building

- Run `bun fastlane:ios:build` to use Fastlane to compile an `.ipa`

### 🤖 Android

#### Dependencies

- [Android Studio](https://developer.android.com/studio)
- [Java Development Kit](https://www.oracle.com/th/java/technologies/downloads/)

#### Setup

- Clone this repository
- Run `bun install` to install `npm` packages

#### Running

- Run `bun start` to start the Metro dev server
- Open the `android` folder with Android Studio
  - _Android Studio should automatically detect the run configurations and initialize Gradle_
- Run on a device or in the emulator

#### Building

- Run `bun fastlane:android:build` to use Fastlane to compile an `.apk` for all architectures
- Alternatively, run `cd android && ./gradlew assembleRelease` to use Gradle directly

#### Testing Android Auto

- Install the [Desktop Head Unit](https://developer.android.com/training/cars/testing/dhu): `sdkmanager "extras;google;auto"`
- On the phone, open the Android Auto app → Settings → tap _Version_ ten times → Developer settings → enable _Unknown sources_ (needed for sideloaded builds) and _Start head unit server_
- `adb forward tcp:5277 tcp:5277 && $ANDROID_HOME/extras/google/auto/desktop-head-unit`
- Cold-start check: `adb shell am force-stop com.cosmonautical.jellify`, then open Jellify from the head unit **without** opening it on the phone. Home, Library, Playlists and Downloads must load.
- The browse tree is built in `src/services/android-auto/`; it is a static tree published to `react-native-nitro-player`, so every folder's children exist at publish time and playable rows are tracks of native `PlayerQueue` playlists.
- The Library tab (Artists / Albums, A–Z) is the one exception: its letter, artist and album folders load on demand instead of being in the published tree. When Android Auto opens one of those, the `JellifyAndroidAuto` native module (Kotlin) emits a `JellifyAndroidAutoLoadChildren` device event with `{ requestId, parentId }`; `registerChildrenLoader` in `src/services/android-auto/bridge.ts` answers it by calling `loadLibraryChildren` (`src/services/android-auto/library.ts`), which fetches from Jellyfin and resolves the request. See the id scheme and routing at the top of `library.ts` for how a `parentId` maps to artists, albums, or an album's tracks.
- To install a dev build next to the store build: `cd android && ./gradlew assembleRelease -PappIdSuffix=.dev`

This ships with `patches/react-native-nitro-player+1.6.1.patch` (applied automatically by `patch-package` on install), which fixes native Android Auto cold start: `MediaBrowserService.kt` otherwise returns an empty root and skips `onLoadChildren` until JS has called `TrackPlayer.configure({ androidAutoEnabled: true })`, which never happens on a force-stopped app with no JS runtime yet. If you bump `react-native-nitro-player`, regenerate the patch instead of hand-editing it: `patch-package` can't read this repo's `bun.lock`, so run `npm pack react-native-nitro-player@<version>` into a temp directory, extract it, then `git diff --no-index` that extracted source against the corresponding files under `node_modules/react-native-nitro-player/` (using `a/node_modules/react-native-nitro-player/...` / `b/node_modules/react-native-nitro-player/...` paths so `patch-package` recognizes it) and save the result to `patches/react-native-nitro-player+<version>.patch`.

#### References

- [Setting up Android SDK](https://developer.android.com/about/versions/14/setup-sdk)
- [ANDROID_HOME not being set](https://stackoverflow.com/questions/26356359/error-android-home-is-not-set-and-android-command-not-in-your-path-you-must/54888107#54888107)
- [Android Auto app not showing up](https://www.reddit.com/r/AndroidAuto/s/LGYHoSPdXm)

## Project Structure

```
src/
  api/          # Jellyfin API calls and helpers
  components/   # Shared UI components
  configs/      # App configuration (Tamagui, etc.)
  constants/    # App-wide constants
  enums/        # TypeScript enums
  hooks/        # Custom React hooks
  providers/    # React context providers
  screens/      # Top-level screen components
  services/     # Background services (e.g. player)
  stores/       # State management stores
  types/        # TypeScript types and interfaces
  utils/        # Utility / helper functions
jest/
  contextual/   # Component and integration tests
  functional/   # Unit tests for utilities and logic
  setup/        # Jest setup and mock files
maestro/
  flows/        # E2E UI test flows grouped by feature area
  subflows/     # Reusable flows shared across multiple stacks
```

## React Compiler

This project uses the [React Compiler](https://react.dev/learn/react-compiler). Since the compiler automatically handles memoization, manual optimization hooks are unnecessary and should be avoided:

- **Do not use `useMemo` or `useCallback`** — the compiler handles this automatically.

### Reanimated Shared Values

When working with Reanimated [`useSharedValue`](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue#react-compiler-support), always use the `get()` and `set()` accessors rather than reading or writing the `.value` property directly:

```ts
// ✅ Correct
const width = useSharedValue(100)
width.set(200)
console.log(width.get())

// ❌ Incorrect — not compatible with the React Compiler
width.value = 200
console.log(width.value)

## Code Style

The project uses ESLint, Prettier, and TypeScript for code quality. Before submitting a PR, please ensure your changes pass all checks:

```sh
bun lint          # Check for ESLint errors
bun format:check  # Check Prettier formatting
bun format        # Auto-fix Prettier formatting
bun tsc           # Type-check with TypeScript
```

Notable style rules enforced by ESLint:
- No semicolons
- `@typescript-eslint/no-explicit-any` is an **error** — avoid `any` types
- `react/react-in-jsx-scope` is disabled (React 17+ JSX transform)

## Testing

Tests are written with [Jest](https://jestjs.io/) and [React Native Testing Library](https://callstack.github.io/react-native-testing-library/).

```sh
bun test          # Run the full test suite
```

Tests live in `jest/contextual/` (component / integration tests) and `jest/functional/` (unit tests). When adding new functionality, please include relevant tests.

Jellify also has an end-to-end UI test suite powered by [Maestro](https://maestro.mobile.dev). See the [Maestro README](maestro/README.md) for details on the flow structure and how to run the tests.

## Submitting a Pull Request

- PRs are submitted against the `main` branch
- Fill out the [pull request template](.github/pull_request_template.md) — include a clear description of what changed and what issue it addresses
- Tag `@anultravioletaurora` as a reviewer
- CI will automatically run the Jest test suite, TypeScript type-check, and ESLint on your PR — make sure all checks pass before requesting review
