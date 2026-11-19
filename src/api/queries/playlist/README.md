# Playlists

Playlists are kept in two central caches, so any screen can show them without wiring up its own fetching or invalidation:

- **User playlists**: playlists the signed in user owns, stored in Jellyfin's config directory
- **Public playlists**: playlists stored in the library (i.e. `.m3u` files) and shared on the server

Each playlist's **tracks** are cached separately and shared by both, since a playlist's contents are the same wherever it's listed.

All three are plain (not infinite) queries holding a complete `BaseItemDto[]`. Playlist tracks are still requested from the server a page at a time, but stored as one list.

## Reading playlists

In components, use the hooks from `index.ts`:

```ts
const { data: playlists } = useUserPlaylists()
const { data: recentPlaylists } = useRecentlyUpdatedPlaylists()
const { data: publicPlaylists } = usePublicPlaylists()
const { data: tracks } = usePlaylistTracks(playlist)
```

The user playlists cache is stored in the order Jellyfin returns it: sorted by `DateLastContentAdded`, most recently updated first. `useRecentlyUpdatedPlaylists` reads it as is, while `useUserPlaylists` sorts it by name in the query's `select`. Jellyfin doesn't return the date itself on `BaseItemDto` (nor `DateLastSaved`, even when requested in `fields`), so the server's order is the only source for it.

Outside React (i.e. Android Auto, CarPlay, prefetching), use the helpers from `cache.ts`:

- `refreshUserPlaylists()` / `refreshPlaylistTracks(playlist)`: always fetch from the server and update the cache (`refreshUserPlaylists` returns them sorted by name). Used by Android Auto and CarPlay, which should never show stale data
- `prefetchPlaylistTracks(playlist)`: warms the cache unless it's already fresh, swallowing errors

The raw query options live in `queries.ts` if you need to compose your own call with `queryClient.query()`.

## Updating playlists

After a mutation, update the caches with the helpers in `cache.ts` instead of calling `setQueryData` directly, so every screen stays in sync:

| Helper | Use after |
|---|---|
| `addUserPlaylist` | Creating a playlist |
| `updateCachedPlaylist` | Renaming or otherwise changing a playlist |
| `removeCachedPlaylist` | Deleting a playlist (also drops its cached tracks) |
| `appendPlaylistTracks` | Adding tracks (also moves the playlist to the front of the user's playlists) |
| `setPlaylistTracks` | Reordering or removing tracks |
| `invalidatePlaylistTracks` | Refetching one playlist's tracks |
| `invalidatePlaylists` | Refetching everything, i.e. after changing libraries |

## Query keys

Every key in `keys.ts` starts with `QueryKeys.Playlists`, so invalidating `PlaylistsQueryKey` refreshes all playlist data at once.

## Imperative queries

TanStack Query 5.104 deprecates `fetchQuery`, `prefetchQuery` and `ensureQueryData` in favour of `queryClient.query()`:

| Instead of | Use |
|---|---|
| `fetchQuery(options)` | `query(options)` |
| `prefetchQuery(options)` | `query(options).catch(() => {})` |
| `ensureQueryData(options)` | `query({ ...options, staleTime: 'static' })` |
| `refetch` regardless of staleness | `query({ ...options, staleTime: 0 })` |
