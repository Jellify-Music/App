/**
 * Core types for multi-backend music server support.
 * These types are backend-agnostic and used throughout the app.
 */

// ============================================================================
// Server Backend Types
// ============================================================================

export type ServerBackend = 'jellyfin' | 'navidrome'

// ============================================================================
// Unified Data Models
// ============================================================================

/**
 * Unified track representation used across all backends.
 * Maps to Jellyfin's BaseItemDto (Audio) and Subsonic's Child/Song.
 */
export interface UnifiedTrack {
	id: string
	name: string
	albumId: string
	albumName: string
	artistId: string
	artistName: string
	/** Duration in seconds */
	duration: number
	trackNumber?: number
	discNumber?: number
	year?: number
	genre?: string
	/** ID used to fetch cover art */
	coverArtId?: string
	/** Blurhash for placeholder images */
	imageBlurHash?: string
	/** Normalization gain value */
	normalizationGain?: number
}

/**
 * Unified album representation.
 * Maps to Jellyfin's BaseItemDto (MusicAlbum) and Subsonic's Album.
 */
export interface UnifiedAlbum {
	id: string
	name: string
	artistId: string
	artistName: string
	year?: number
	genre?: string
	trackCount?: number
	duration?: number
	coverArtId?: string
	imageBlurHash?: string
}

/**
 * Unified artist representation.
 * Maps to Jellyfin's BaseItemDto (MusicArtist) and Subsonic's Artist.
 */
export interface UnifiedArtist {
	id: string
	name: string
	albumCount?: number
	coverArtId?: string
	imageBlurHash?: string
	overview?: string
}

/**
 * Unified playlist representation.
 * Maps to Jellyfin's BaseItemDto (Playlist) and Subsonic's Playlist.
 */
export interface UnifiedPlaylist {
	id: string
	name: string
	trackCount: number
	duration?: number
	isPublic?: boolean
	ownerId?: string
	ownerName?: string
	coverArtId?: string
	imageBlurHash?: string
}

/**
 * Search results containing all item types.
 */
export interface UnifiedSearchResults {
	artists: UnifiedArtist[]
	albums: UnifiedAlbum[]
	tracks: UnifiedTrack[]
	playlists: UnifiedPlaylist[]
}

/**
 * Starred/favorited content.
 */
export interface UnifiedStarred {
	artists: UnifiedArtist[]
	albums: UnifiedAlbum[]
	tracks: UnifiedTrack[]
}

/**
 * Lyrics for a track.
 */
export interface UnifiedLyrics {
	/** Synced lyrics with timestamps */
	lines?: Array<{ start: number; text: string }>
	/** Plain text lyrics (unsynced) */
	text?: string
}

// ============================================================================
// Query Options
// ============================================================================

export interface AlbumQueryOptions {
	artistId?: string
	type?: 'recent' | 'frequent' | 'random' | 'newest' | 'alphabetical'
	limit?: number
	offset?: number
}

export interface TrackQueryOptions {
	albumId?: string
	artistId?: string
	playlistId?: string
	limit?: number
	offset?: number
}

export interface SearchOptions {
	limit?: number
	artistLimit?: number
	albumLimit?: number
	trackLimit?: number
}

// ============================================================================
// Authentication
// ============================================================================

export interface AuthResult {
	userId: string
	username: string
	accessToken: string
	/** For Subsonic: salt used in token generation */
	salt?: string
}

// ============================================================================
// Streaming
// ============================================================================

export interface StreamOptions {
	/** Maximum bitrate in kbps */
	maxBitrate?: number
	/** Audio format (e.g., 'mp3', 'opus', 'raw') */
	format?: string
}
