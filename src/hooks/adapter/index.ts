/**
 * Unified adapter hooks barrel export.
 * These hooks provide a backend-agnostic interface for data fetching and mutations.
 */

// Search
export { useSearch } from './useSearch'

// Favorites
export {
	useFavorites,
	useFavoriteArtists,
	useFavoriteAlbums,
	useFavoriteTracks,
	useStar,
	useUnstar,
	useToggleStar,
} from './useFavorites'

// Playlists
export {
	usePlaylists,
	usePlaylistTracks,
	useCreatePlaylist,
	useUpdatePlaylist,
	useAddToPlaylist,
	useDeletePlaylist,
} from './usePlaylists'

// Browsing
export {
	useArtists,
	useArtist,
	useArtistAlbums,
	useAlbums,
	useAlbum,
	useAlbumTracks,
	useTracks,
	useTrack,
	useInstantMix,
	useSimilarArtists,
} from './useBrowse'

// Lyrics
export { useLyrics } from './useLyrics'

// Track Mapping
export { useTrackMapper } from './useTrackMapper'

// Home Content (for Navidrome)
export {
	useRecentAlbums,
	useFrequentAlbums,
	useNewestAlbums,
	useRandomAlbums,
	useNavidromeHomeContent,
} from './useHomeContent'
