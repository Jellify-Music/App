# Navidrome Implementation Progress

## Executive Summary

Jellify now supports **Navidrome** as a backend alongside Jellyfin using a unified adapter pattern. Playback, library browsing, and most core features work for both backends.

---

## ✅ What's Working

### Core Playback
- **Audio streaming** via Subsonic `stream.view` endpoint with hex-encoded password auth
- **Track mapping** via `adapter.mapToJellifyTrack()` - each backend builds JellifyTrack with proper URLs
- **Queue loading** from all main entry points (tracks, albums, playlists, artists, home sections)

### Library Browsing
| Feature | Status | Notes |
|---------|--------|-------|
| Albums | ✅ Working | `useAlbums` uses adapter for Navidrome |
| Tracks | ✅ Working | `useTracks` uses adapter for Navidrome |
| Artists | ✅ Working | Unified hooks |
| Playlists | ✅ Working | Unified hooks |
| Album Details | ✅ Working | `useAlbumDiscs` with disc grouping |
| Artist Details | ✅ Working | Uses adapter |

### Home Content
| Feature | Status | Notes |
|---------|--------|-------|
| Recently Played | ✅ Working | `useRecentlyPlayedTracks` |
| On Repeat | ✅ Working | `useFrequentlyPlayedTracks` |
| Recently Added Albums | ✅ Working | Unified hooks |

### Search
| Feature | Status | Notes |
|---------|--------|-------|
| Basic Search | ✅ Working | Artists, albums, tracks |
| Search Suggestions | ✅ Working | `useSearchSuggestions` via adapter |

### Favorites
| Feature | Status | Notes |
|---------|--------|-------|
| Star/Unstar | ✅ Working | Uses Subsonic `star.view`/`unstar.view` |
| Get Starred Items | ✅ Working | `getStarred2.view` |

### Playlists
| Feature | Status | Notes |
|---------|--------|-------|
| List Playlists | ✅ Working | |
| Get Playlist Tracks | ✅ Working | |
| Create Playlist | ✅ Working | `createPlaylist.view` |
| Update Playlist | ✅ Working | |
| Delete Playlist | ✅ Working | |

---

## ⚠️ Partial/Limited Features

### Playback Reporting
| Feature | Jellyfin | Navidrome | Notes |
|---------|----------|-----------|-------|
| Report Start | ✅ | ⏭️ Skipped | Subsonic has no equivalent |
| Report Progress | ✅ | ⏭️ Skipped | Subsonic has no equivalent |
| Report Stop | ✅ | ⏭️ Skipped | Subsonic has no equivalent |
| Scrobbling | ✅ | ✅ | Uses `scrobble.view` on track complete |

### Instant Mix / Similar Tracks
- Uses `getSimilarSongs2.view` - may return limited results depending on Navidrome's metadata

### Lyrics
- Uses `getLyrics.view` - only works if Navidrome has embedded lyrics or external sources configured

---

## ❌ Not Yet Implemented / Known Gaps

### CarPlay
- CarPlay components use a callback pattern for `loadNewQueue`
- Would require threading adapter through CarPlay navigation tree
- **Impact:** CarPlay playback on Navidrome won't use proper stream URLs

### Downloads
- Downloads use Jellyfin-specific URLs and caching
- Navidrome downloads may fail or use wrong URLs
- **Suggested fix:** Add `getDownloadUrl()` to adapter interface

### Transcoding
- Navidrome supports transcoding via `stream.view?format=xxx&maxBitRate=xxx`
- Current implementation always uses direct stream
- **Suggested fix:** Extend `mapToJellifyTrack` to accept quality options

### Media Info Queries
- `useStreamedMediaInfo` uses Jellyfin SDK's `MediaInfoApi`
- Navidrome doesn't have an equivalent endpoint
- **Impact:** Codec info, bitrate display may be missing for Navidrome

### User Data Sync
- Play count, last played timestamps sync via scrobbling
- But real-time "now playing" status isn't reported to server

---

## Architecture Overview

### Adapter Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    MusicServerAdapter                        │
│                      (Interface)                             │
├─────────────────────────────────────────────────────────────┤
│  getAlbums(), getTracks(), getArtists(), getPlaylists()    │
│  search(), star(), unstar(), getStarred()                   │
│  getStreamUrl(), getCoverArtUrl(), mapToJellifyTrack()     │
│  reportPlaybackStart/Progress/End()                         │
└─────────────────────────────────────────────────────────────┘
              ▲                           ▲
              │                           │
┌─────────────┴───────────┐   ┌──────────┴────────────┐
│   JellyfinAdapter       │   │   NavidromeAdapter    │
├─────────────────────────┤   ├───────────────────────┤
│ Uses @jellyfin/sdk      │   │ Uses Subsonic API     │
│ /Audio/{id}/stream      │   │ /rest/stream.view     │
│ X-Emby-Token header     │   │ Auth params in URL    │
│ Full playback reporting │   │ Scrobbling only       │
└─────────────────────────┘   └───────────────────────┘
```

### Key Files Modified

| File | Changes |
|------|---------|
| `src/api/core/adapter.ts` | Added `mapToJellifyTrack()` method |
| `src/api/adapters/navidrome-adapter.ts` | Implemented all adapter methods |
| `src/api/adapters/jellyfin-adapter.ts` | Implemented `mapToJellifyTrack()` |
| `src/providers/Player/functions/queue.ts` | Added `mapTrackToJellify()` dispatcher |
| `src/providers/Player/interfaces.ts` | Added `adapter` to queue mutations |
| `src/api/queries/album/index.ts` | Enabled for Navidrome via adapter |
| `src/api/queries/track/index.ts` | Enabled for Navidrome via adapter |
| `src/api/mutations/playback/functions/*` | Skip Jellyfin calls for Navidrome |
| `src/components/*/` | Pass adapter to `loadNewQueue()` calls |

### Track Mapping Flow

```
User taps track
       │
       ▼
loadNewQueue({ adapter, ... })
       │
       ▼
mapTrackToJellify(item, adapter, api, ...)
       │
       ├── if (adapter) ──► adapter.mapToJellifyTrack(unifiedTrack)
       │                           │
       │                    ┌──────┴──────┐
       │                    │ Navidrome   │ → Subsonic stream URL
       │                    │ Jellyfin    │ → Audio API URL + header
       │                    └─────────────┘
       │
       └── else ──► mapDtoToTrack(api, item) [legacy Jellyfin path]
       
       ▼
TrackPlayer.setQueue([jellifyTrack])
       │
       ▼
Audio plays! 🎵
```

---

## Testing Checklist

### Playback
- [ ] Play track from library
- [ ] Play album (play button)
- [ ] Play album shuffled
- [ ] Play playlist
- [ ] Play artist (all tracks)
- [ ] Play from "On Repeat"
- [ ] Play from "Play it again"
- [ ] Play from search results
- [ ] Queue: Play Next
- [ ] Queue: Play Later

### Library
- [ ] Browse albums
- [ ] Browse tracks
- [ ] Browse artists
- [ ] Browse playlists
- [ ] Album disc grouping
- [ ] Infinite scroll pagination

### Other
- [ ] Favorites toggle
- [ ] Create playlist
- [ ] Edit playlist
- [ ] Delete playlist
- [ ] Search
- [ ] Instant mix

---

## Next Steps / Recommendations

1. **CarPlay Support**
   - Thread adapter through CarPlay component tree
   - Or store adapter in Zustand for global access

2. **Download Support**
   - Add `getDownloadUrl(trackId, quality)` to adapter
   - Update download manager to use adapter

3. **Quality Settings**
   - Add transcoding options to `mapToJellifyTrack`
   - Respect user's streaming quality preference

4. **Error Handling**
   - Add better error messages for Navidrome-specific failures
   - Handle auth token expiry gracefully

5. **Testing**
   - Add unit tests for adapters
   - E2E tests for both backends
