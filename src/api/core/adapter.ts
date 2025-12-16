/**
 * Abstract adapter interface for music server backends.
 * Implementations exist for Jellyfin and Navidrome/Subsonic.
 */

import {
	AlbumQueryOptions,
	AuthResult,
	SearchOptions,
	StreamOptions,
	TrackQueryOptions,
	UnifiedAlbum,
	UnifiedArtist,
	UnifiedLyrics,
	UnifiedPlaylist,
	UnifiedSearchResults,
	UnifiedStarred,
	UnifiedTrack,
} from './types'

/**
 * Unified music server adapter interface.
 * All backend-specific implementations must conform to this interface.
 */
export interface MusicServerAdapter {
	// =========================================================================
	// Connection & Authentication
	// =========================================================================

	/**
	 * Test connection to the server.
	 * @returns true if server is reachable and responding
	 */
	ping(): Promise<boolean>

	/**
	 * Authenticate with username and password.
	 * @returns Authentication result with tokens
	 */
	authenticate(username: string, password: string): Promise<AuthResult>

	// =========================================================================
	// Browsing - Artists
	// =========================================================================

	/**
	 * Get all artists, optionally filtered by library.
	 */
	getArtists(libraryId?: string): Promise<UnifiedArtist[]>

	/**
	 * Get a single artist by ID.
	 */
	getArtist(id: string): Promise<UnifiedArtist>

	/**
	 * Get albums by a specific artist.
	 */
	getArtistAlbums(artistId: string): Promise<UnifiedAlbum[]>

	// =========================================================================
	// Browsing - Albums
	// =========================================================================

	/**
	 * Get albums with optional filtering and sorting.
	 */
	getAlbums(options?: AlbumQueryOptions): Promise<UnifiedAlbum[]>

	/**
	 * Get a single album by ID.
	 */
	getAlbum(id: string): Promise<UnifiedAlbum>

	/**
	 * Get all tracks in an album.
	 */
	getAlbumTracks(albumId: string): Promise<UnifiedTrack[]>

	// =========================================================================
	// Browsing - Tracks
	// =========================================================================

	/**
	 * Get tracks with optional filtering.
	 */
	getTracks(options?: TrackQueryOptions): Promise<UnifiedTrack[]>

	/**
	 * Get a single track by ID.
	 */
	getTrack(id: string): Promise<UnifiedTrack>

	// =========================================================================
	// Search
	// =========================================================================

	/**
	 * Search for artists, albums, tracks, and playlists.
	 */
	search(query: string, options?: SearchOptions): Promise<UnifiedSearchResults>

	// =========================================================================
	// Playlists
	// =========================================================================

	/**
	 * Get all playlists for the current user.
	 */
	getPlaylists(): Promise<UnifiedPlaylist[]>

	/**
	 * Get tracks in a playlist.
	 */
	getPlaylistTracks(playlistId: string): Promise<UnifiedTrack[]>

	/**
	 * Create a new playlist.
	 */
	createPlaylist(name: string, trackIds?: string[]): Promise<UnifiedPlaylist>

	/**
	 * Update playlist metadata or tracks.
	 */
	updatePlaylist(
		id: string,
		updates: {
			name?: string
			trackIdsToAdd?: string[]
			trackIndicesToRemove?: number[]
		},
	): Promise<void>

	/**
	 * Delete a playlist.
	 */
	deletePlaylist(id: string): Promise<void>

	// =========================================================================
	// Favorites
	// =========================================================================

	/**
	 * Star/favorite an item (artist, album, or track).
	 */
	star(id: string): Promise<void>

	/**
	 * Unstar/unfavorite an item.
	 */
	unstar(id: string): Promise<void>

	/**
	 * Get all starred/favorited content.
	 */
	getStarred(): Promise<UnifiedStarred>

	// =========================================================================
	// Playback & Streaming
	// =========================================================================

	/**
	 * Get the streaming URL for a track.
	 * This URL can be passed directly to the audio player.
	 */
	getStreamUrl(trackId: string, options?: StreamOptions): string

	/**
	 * Get the cover art URL for an item.
	 * @param id The item ID or cover art ID
	 * @param size Optional size in pixels (width)
	 */
	getCoverArtUrl(id: string, size?: number): string

	/**
	 * Report that playback has started.
	 */
	reportPlaybackStart(trackId: string): Promise<void>

	/**
	 * Report playback progress.
	 * @param position Current position in seconds
	 */
	reportPlaybackProgress(trackId: string, position: number): Promise<void>

	/**
	 * Report that playback has ended.
	 * @param position Final position in seconds
	 * @param completed Whether the track finished playing
	 */
	reportPlaybackEnd(trackId: string, position: number, completed: boolean): Promise<void>

	// =========================================================================
	// Optional Features (may not be supported by all backends)
	// =========================================================================

	/**
	 * Get an instant mix / similar songs based on a seed item.
	 * Jellyfin uses getInstantMix, Navidrome uses getSimilarSongs.
	 */
	getInstantMix?(seedId: string, limit?: number): Promise<UnifiedTrack[]>

	/**
	 * Get similar artists.
	 */
	getSimilarArtists?(artistId: string): Promise<UnifiedArtist[]>

	/**
	 * Get lyrics for a track.
	 */
	getLyrics?(trackId: string): Promise<UnifiedLyrics | null>

	/**
	 * Get artist info including biography, similar artists, etc.
	 */
	getArtistInfo?(artistId: string): Promise<{
		biography?: string
		musicBrainzId?: string
		lastFmUrl?: string
		similarArtists?: UnifiedArtist[]
	}>

	// =========================================================================
	// Home Content (activity-based queries)
	// =========================================================================

	/**
	 * Get recently played tracks (listening history).
	 * @param limit Maximum number of tracks to return
	 */
	getRecentTracks?(limit?: number): Promise<UnifiedTrack[]>

	/**
	 * Get frequently played tracks (on repeat / most played).
	 * @param limit Maximum number of tracks to return
	 */
	getFrequentTracks?(limit?: number): Promise<UnifiedTrack[]>

	/**
	 * Get recently played artists.
	 * @param limit Maximum number of artists to return
	 */
	getRecentArtists?(limit?: number): Promise<UnifiedArtist[]>

	/**
	 * Get frequently played artists.
	 * @param limit Maximum number of artists to return
	 */
	getFrequentArtists?(limit?: number): Promise<UnifiedArtist[]>

	// =========================================================================
	// Album Disc Support
	// =========================================================================

	/**
	 * Get album tracks grouped by disc number.
	 * Returns an array of disc sections with their tracks.
	 */
	getAlbumDiscs?(albumId: string): Promise<Array<{ disc: number; tracks: UnifiedTrack[] }>>
}

/**
 * Factory function type for creating adapters.
 */
export type AdapterFactory = (
	serverUrl: string,
	accessToken?: string,
	salt?: string,
) => MusicServerAdapter
