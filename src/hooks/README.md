# Hooks

This folder contains all custom React hooks for Jellify. New hooks should be extracted from their components and placed here rather than living inline inside component files.

## Gestures (`gestures/`)

Jellify uses **Gesture Handler v3**, which introduces a hooks-based API (`usePanGesture`, `useTapGesture`, `useNativeGesture`, etc.) in place of the older class-based gesture system. All gesture logic should be written as hooks and placed in this folder.

Key points:

- Use the v3 hooks from `react-native-gesture-handler` — do **not** use the v2 `PanGestureHandler`/`TapGestureHandler` JSX components.
- Gesture worklets that need to call JS functions should use `runOnJS` from `react-native-worklets`.
- Compose multiple gestures with `useExclusiveGestures` or `useSimultaneousGestures` as appropriate.
- Shared animated values driven by gestures should live inside the hook alongside the gesture definition.

See `gestures/player.ts` for a reference implementation (`useAlbumCoverGesture`).

## Downloads (`downloads/`)

The downloads hooks wrap **`react-native-nitro-player`**'s download APIs via React Query.

- `useDownloads` — returns the full list of downloaded tracks.
- `useIsDownloaded` — O(1) per call; uses a stable `Set<string>` selector so React Query's structural sharing prevents unnecessary re-renders across the potentially large Track list.
- Mutations for enqueuing/removing downloads live in `mutations.ts` and helper utilities in `utils.ts`.

When adding new download-related hooks, keep query keys in `keys.ts` and raw query/mutation configs in `queries.ts` / `mutations.ts` so the folder stays navigable.

## Adding New Hooks

When implementing new behaviour:

1. **Extract** the hook from the component — even if only one component uses it today, keeping hooks here makes them discoverable, testable, and easier to reuse in the future. Not to mention it makes the component files leaner.
2. **Name** files after what they return: `use-<noun>.ts` for standalone hooks, or a subfolder when a domain grows beyond a single file (see `downloads/`, `gestures/`, `player/`, `ota/`).
3. **Avoid** putting gesture logic inside component bodies; always delegate to a hook in `gestures/`.

## Further Reading

- [react-native-gesture-handler — Hooks API (v3)](https://docs.swmansion.com/react-native-gesture-handler/docs/gesture-handlers/hooks/)
- [react-native-nitro-player — Documentation](https://nitroplayer.riteshshukla.in/)
- [react-native-nitro-player — GitHub](https://github.com/riteshshukla04/react-native-nitro-player)
