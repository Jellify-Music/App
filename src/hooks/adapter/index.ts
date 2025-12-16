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
	useAlbumDiscs,
	useTracks,
	useTrack,
	useInstantMix,
	useSimilarArtists,
	type DiscSection,
} from './useBrowse'

// Lyrics
export { useLyrics } from './useLyrics'

// Track Mapping
export { useTrackMapper } from './useTrackMapper'

// Home Content
export {
	useRecentAlbums,
	useFrequentAlbums,
	useNewestAlbums,
	useRandomAlbums,
	useNavidromeHomeContent,
	useRecentTracks,
	useFrequentTracks,
	useUnifiedRecentArtists,
	useUnifiedFrequentArtists,
} from './useHomeContent'

// Discovery & Generic Item
export { useItem, useSearchSuggestions, useDiscoverArtists } from './useDiscovery'
