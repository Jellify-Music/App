# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jellify is a React Native music player for Jellyfin Media Server, available on iOS and Android. It features offline playback, CarPlay/Android Auto support, and Google Cast integration.

## Commands

### Development Setup
```bash
bun run init-ios          # Install dependencies and pods for iOS
bun run init-android      # Install dependencies for Android
```

### Running the App
```bash
bun run ios               # Run on iOS simulator
bun run android           # Run on Android emulator
bun start                 # Start Metro bundler
```

### Code Quality
```bash
bun run lint              # Run ESLint
bun run tsc               # TypeScript type checking
bun run format            # Format with Prettier
bun run format:check      # Check formatting
```

### Testing
```bash
bun run test              # Run all tests
bunx jest <path>          # Run specific test file
bunx jest --watch         # Watch mode
```
Tests are in `jest/` directory: `jest/functional/` for logic tests, `jest/contextual/` for component tests.

### Building
```bash
bun run androidBuild                  # Build Android release APK
bun run fastlane:ios:build           # Build iOS via Fastlane
bun run fastlane:android:build       # Build Android via Fastlane
```

## Architecture

### Tech Stack
- **React 19.2.0** / **React Native 0.83.1** with **React Compiler enabled** (babel-plugin-react-compiler)
- **Zustand** for client state management
- **TanStack React Query** for server state and caching
- **React Navigation 7.x** for navigation
- **Tamagui** for UI components and theming
- **Jellyfin SDK** for backend API
- **React Native Track Player** for audio playback

### Source Structure
```
src/
├── api/           # Jellyfin API - queries/, mutations/, SDK client setup
├── stores/        # Zustand stores - player/, settings/, network state
├── screens/       # Navigation screens organized by tab
├── components/    # Reusable UI components
├── providers/     # React contexts (Player, Storage, Display, Artist)
├── hooks/         # Custom hooks including player/
├── player/        # PlaybackService - background playback event handling
├── types/         # TypeScript definitions
├── enums/         # Query keys, storage keys, etc.
├── constants/     # App constants (query client config, player capabilities)
└── utils/         # Formatting, parsing utilities
```

### Key Patterns

**State Management:**
- Zustand stores in `src/stores/` persisted via MMKV
- Player state split: `queue.ts` (queue/shuffle/repeat), `engine.ts` (active player backend)
- Settings stores: `app.ts`, `player.ts`, `usage.ts`, `developer.ts`

**Data Fetching:**
- TanStack Query hooks in `src/api/queries/`
- Mutations in `src/api/mutations/`
- Query keys defined in `src/enums/query-keys.ts`
- 4-hour stale time, infinite GC time for offline support

**Navigation:**
- Root stack with modal presentations (PlayerRoot, Context, AddToPlaylist)
- Bottom tabs: Home, Library, Search, Discover, Settings
- Lazy-loaded screens

**Playback:**
- `PlaybackService` in `src/player/index.ts` handles remote events and prefetching
- `PlayerProvider` in `src/providers/Player/` manages track player lifecycle
- Engine store tracks active player: Track Player, Google Cast, or CarPlay

**Provider Hierarchy:**
```
SafeAreaProvider → ErrorBoundary → PersistQueryClientProvider → NavigationContainer
  → GestureHandlerRootView → TamaguiProvider → StorageProvider → PlayerProvider → Root
```

### Storage
- MMKV for all local persistence (faster than AsyncStorage)
- Queue limited to 500 items to prevent storage overflow
- Versioned storage with migration support

### Performance
- React Compiler handles automatic memoization
- react-native-screens for native navigation
- react-freeze prevents inactive screen re-renders
- @shopify/flash-list for performant lists
- react-native-nitro-fetch for optimized network requests
