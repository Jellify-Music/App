# Navidrome Implementation Progress

## Executive Summary

Jellify now supports **Navidrome** as a backend alongside Jellyfin using a unified adapter pattern. Playback, library browsing, and most core features work for both backends.

**Last Updated:** December 2024

---

## ✅ What's Working

### Core Playback
- **Audio streaming** via Subsonic `stream.view` endpoint with hex-encoded password auth
- **Track mapping** via `adapter.mapToJellifyTrack()` - each backend builds JellifyTrack with proper URLs
- **Queue loading** from all main entry points (tracks, albums, playlists, artists, home sections)
- **CarPlay playback** - adapter is now threaded through CarPlay components ✅ FIXED

### Library Browsing
| Feature | Status | Notes |
|---------|--------|-------|
| Albums | ✅ Working | Unified adapter hooks |
| Tracks | ✅ Working | Unified adapter hooks |
| Artists | ✅ Working | Unified adapter hooks |
| Playlists | ✅ Working | Unified adapter hooks |
| Album Details | ✅ Working | `useAlbumDiscs` with disc grouping |
| Artist Details | ✅ Working | Uses adapter |

### Home Content
| Feature | Status | Notes |
|---------|--------|-------|
| Recently Played | ✅ Working | Now uses adapter for both backends |
| On Repeat | ✅ Working | Now uses adapter for both backends |
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
| List Playlists | ✅ Working | Now uses adapter |
| Get Playlist Tracks | ✅ Working | Now uses adapter |
| Create Playlist | ✅ Working | `createPlaylist.view` |
| Update Playlist | ✅ Working | |
| Delete Playlist | ✅ Working | |

### Downloads
| Feature | Status | Notes |
|---------|--------|-------|
| Download Tracks | ✅ Working | Uses `adapter.getDownloadUrl()` ✅ FIXED |
| Offline Playback | ✅ Working | |

---

## ⚠️ Partial/Limited Features

### Playback Reporting
| Feature | Jellyfin | Navidrome | Notes |
|---------|----------|-----------|-------|
| Report Start | ✅ | ⏭️ No-op | Subsonic has no equivalent (adapter handles gracefully) |
| Report Progress | ✅ | ⏭️ No-op | Subsonic has no equivalent (adapter handles gracefully) |
| Report Stop | ✅ | ⏭️ No-op | Subsonic has no equivalent (adapter handles gracefully) |
| Scrobbling | ✅ | ✅ | Uses `scrobble.view` on track complete |

### Instant Mix / Similar Tracks
- Uses `getSimilarSongs2.view` - may return limited results depending on Navidrome's metadata

### Lyrics
- Uses `getLyrics.view` - only works if Navidrome has embedded lyrics or external sources configured

---

## ❌ Known Limitations

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

### Public Playlists
- Jellyfin-specific concept, not available on Navidrome

### Artist "Featured On"
- Jellyfin-specific concept (albums where artist appears as guest)
- Not available on Navidrome

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
│  getStreamUrl(), getCoverArtUrl(), getDownloadUrl()        │
│  mapToJellifyTrack()                                         │
│  reportPlaybackStart/Progress/End() (no-op for Navidrome)  │
└─────────────────────────────────────────────────────────────┘
              ▲                           ▲
              │                           │
┌─────────────┴───────────┐   ┌──────────┴────────────┐
│   JellyfinAdapter       │   │   NavidromeAdapter    │
├─────────────────────────┤   ├───────────────────────┤
│ Uses @jellyfin/sdk      │   │ Uses Subsonic API     │
│ /Audio/{id}/stream      │   │ /rest/stream.view     │
│ /Audio/{id}/universal   │   │ /rest/download.view   │
│ X-Emby-Token header     │   │ Auth params in URL    │
│ Full playback reporting │   │ Scrobbling only       │
└─────────────────────────┘   └───────────────────────┘
```

### Query Migration Status

All major query hooks now use the adapter pattern, eliminating manual backend checks:

| Query Hook | Status |
|------------|--------|
| `useRecentlyPlayedTracks` | ✅ Uses adapter |
| `useRecentArtists` | ✅ Uses adapter |
| `useFrequentlyPlayedTracks` | ✅ Uses adapter |
| `useFrequentlyPlayedArtists` | ✅ Uses adapter |
| `useArtistAlbums` | ✅ Uses adapter |
| `useUserPlaylists` | ✅ Uses adapter |
| `usePlaylistTracks` | ✅ Uses adapter |
| `useTracks` | ✅ Uses adapter |
| `useAlbumArtists` | ✅ Uses adapter |

### Key Files

| File | Purpose |
|------|---------|
| `src/api/core/adapter.ts` | MusicServerAdapter interface |
| `src/api/adapters/navidrome-adapter.ts` | Navidrome/Subsonic implementation |
| `src/api/adapters/jellyfin-adapter.ts` | Jellyfin SDK wrapper |
| `src/api/adapters/*-mappings.ts` | Type conversion functions |
| `src/stores/index.ts` | `useAdapter()` hook |
| `src/utils/unified-conversions.ts` | UnifiedType → BaseItemDto converters |

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

## Test Coverage

Unit tests exist for adapter mappings:
- `jest/functional/adapters/navidrome-mappings.test.ts`
- `jest/functional/adapters/navidrome-adapter.test.ts`
- `jest/functional/adapters/jellyfin-adapter.test.ts`

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
- [ ] CarPlay playback

### Library
- [ ] Browse albums
- [ ] Browse tracks
- [ ] Browse artists
- [ ] Browse playlists
- [ ] Album disc grouping
- [ ] Infinite scroll pagination

### Downloads
- [ ] Download track
- [ ] Offline playback

### Other
- [ ] Favorites toggle
- [ ] Create playlist
- [ ] Edit playlist
- [ ] Delete playlist
- [ ] Search
- [ ] Instant mix

---

## Remaining Improvements

1. **Quality Settings**
   - Add transcoding options to `mapToJellifyTrack`
   - Respect user's streaming quality preference

2. **Error Handling**
   - Add better error messages for Navidrome-specific failures
   - Handle auth token expiry gracefully

3. **Home Component Unification**
   - Currently has separate `NavidromeHomeContent` and `JellyfinHomeContent`
   - Could be unified using adapter hooks

