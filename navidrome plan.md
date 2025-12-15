# Navidrome Integration Implementation Plan

✅ **IMPLEMENTATION COMPLETE**

Add Navidrome support to Jellify with feature parity to Jellyfin, using a backend adapter abstraction.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Server mode | **Single active, multi-saved** | One active connection, but switch between saved servers    |
| Server detection | **Auto-detect from response** | Ping both endpoints, detect from response format |
| API approach | **`subsonic-api` package** | Well-maintained, handles MD5 auth, TypeScript support |
| Feature parity | **Seamless experience** | Same UI regardless of backend, different algorithms acceptable |

---

## Files Created

### Core Abstraction (`src/api/core/`)
- `types.ts` - `ServerBackend`, unified models (UnifiedTrack, UnifiedAlbum, etc.)
- `adapter.ts` - `MusicServerAdapter` interface (35+ methods)
- `server-detection.ts` - `detectServerType()` auto-detection
- `index.ts` - Barrel exports

### Adapters (`src/api/adapters/`)
- `jellyfin-adapter.ts` - Wraps `@jellyfin/sdk`
- `jellyfin-mappings.ts` - BaseItemDto → Unified types
- `navidrome-adapter.ts` - Uses `subsonic-api`
- `navidrome-mappings.ts` - Subsonic → Unified types
- `index.ts` - Barrel exports

### Stores
- `types/JellifyServer.ts` - Added `backend: ServerBackend` field
- `stores/index.ts` - Added `useAdapter()` hook
- `stores/network/multi-server.ts` - Saved servers store

### Login Flow
- `api/mutations/public-system-info/useConnectToServer.ts` - Unified connection hook
- `screens/Login/server-address.tsx` - Updated with auto-detection UI

### Dependencies
- `subsonic-api@3.2.0`

---

## Usage

### Auto-detect and connect to a server
```typescript
const { mutate: connect } = useConnectToServer({
  onSuccess: (server, backend) => {
    console.log(`Connected to ${backend}`) // 'jellyfin' or 'navidrome'
  }
})
connect({ serverAddress: 'music.example.com', useHttps: true })
```

### Get the appropriate adapter
```typescript
const adapter = useAdapter() // Returns JellyfinAdapter or NavidromeAdapter

// All methods work identically regardless of backend
const results = await adapter?.search('query')
const albums = await adapter?.getAlbums({ type: 'recent' })
await adapter?.star(trackId)
```

---

## Feature Mapping

| Feature | Works identically | Notes |
|---------|------------------|-------|
| Browse Artists/Albums/Tracks | ✅ | |
| Search | ✅ | |
| Playlists CRUD | ✅ | |
| Favorites | ✅ | star/unstar API |
| Streaming | ✅ | Different URL format |
| Cover Art | ✅ | Different URL format |
| Scrobble | ✅ | |
| Instant Mix | ⚠️ | Jellyfin: `getInstantMix`, Navidrome: `getSimilarSongs` |
| Lyrics | ✅ | Both support (OpenSubsonic extension) |
| Downloads | ✅ | Uses stream URL |

---

## Future Enhancements (Optional)
- Server switcher UI in Settings screen  
- Migrate remaining direct SDK calls to use adapter pattern
- Unit tests for adapter mappings
