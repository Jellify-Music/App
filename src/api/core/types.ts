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

// ============================================================================
// Union Types & Type Guards
// ============================================================================

/**
 * Union type for any unified item. Use type guards below to narrow.
 */
export type UnifiedItem = UnifiedTrack | UnifiedAlbum | UnifiedArtist | UnifiedPlaylist

/**
 * Discriminated item type enum for explicit type checking.
 */
export type UnifiedItemType = 'track' | 'album' | 'artist' | 'playlist'

/**
 * Type guard for UnifiedTrack.
 * Tracks have 'albumId' and 'artistId' as required fields.
 */
export function isUnifiedTrack(item: UnifiedItem): item is UnifiedTrack {
	return (
		'albumId' in item &&
		'artistId' in item &&
		'duration' in item &&
		typeof item.duration === 'number'
	)
}

/**
 * Type guard for UnifiedAlbum.
 * Albums have 'artistId' and optional 'trackCount'.
 */
export function isUnifiedAlbum(item: UnifiedItem): item is UnifiedAlbum {
	return (
		'artistId' in item && !('albumId' in item) && !('trackCount' in item && 'ownerId' in item)
	)
}

/**
 * Type guard for UnifiedArtist.
 * Artists have 'albumCount' but no 'artistId'.
 */
export function isUnifiedArtist(item: UnifiedItem): item is UnifiedArtist {
	return !('artistId' in item) && !('trackCount' in item)
}

/**
 * Type guard for UnifiedPlaylist.
 * Playlists have 'trackCount' and optional 'ownerId'.
 */
export function isUnifiedPlaylist(item: UnifiedItem): item is UnifiedPlaylist {
	return 'trackCount' in item && typeof (item as UnifiedPlaylist).trackCount === 'number'
}

/**
 * Get the item type for a UnifiedItem.
 */
export function getUnifiedItemType(item: UnifiedItem): UnifiedItemType {
	if (isUnifiedTrack(item)) return 'track'
	if (isUnifiedPlaylist(item)) return 'playlist'
	if (isUnifiedAlbum(item)) return 'album'
	return 'artist'
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

/**
 * Convert a StreamingQuality enum value to StreamOptions for Subsonic API.
 * Maps quality settings to maxBitRate and format params.
 */
export function streamingQualityToStreamOptions(
	quality: 'original' | 'high' | 'medium' | 'low',
): StreamOptions {
	switch (quality) {
		case 'original':
			return { format: 'raw' } // Direct stream, no transcoding
		case 'high':
			return { maxBitrate: 320, format: 'mp3' }
		case 'medium':
			return { maxBitrate: 192, format: 'mp3' }
		case 'low':
			return { maxBitrate: 128, format: 'mp3' }
		default:
			return { format: 'raw' }
	}
}
