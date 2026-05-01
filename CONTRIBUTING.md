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
