# Jellify Player Context

Jellify is built with [`react-native-track-player`](https://rntp.dev) and has two context providers wrapped around it's functionality:

- `QueueContext`, exposed via various hooks powered by 
- `PlayerProvider`, exposed via `usePlayerContext` hook

`react-native-track-player` manages it's own queue for sequential playback. Jellify manages it's own internal queue in state, relying on the `TrackPlayer`'s queue, and then exposes it to the rest of the app *synchronously*
