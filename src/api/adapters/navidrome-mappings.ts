/**
 * Type mapping functions for converting between Subsonic API types
 * and unified backend-agnostic types.
 */

import {
	UnifiedAlbum,
	UnifiedArtist,
	UnifiedPlaylist,
	UnifiedSearchResults,
	UnifiedStarred,
	UnifiedTrack,
} from '../core/types'

// ============================================================================
// Subsonic API Types (from subsonic-api package responses)
// ============================================================================

/** Subsonic Child/Song type */
interface SubsonicSong {
	id: string
	title?: string
	album?: string
	albumId?: string
	artist?: string
	artistId?: string
	duration?: number
	track?: number
	discNumber?: number
	year?: number
	genre?: string
	coverArt?: string
}

/** Subsonic Album type */
interface SubsonicAlbum {
	id: string
	name?: string
	artist?: string
	artistId?: string
	year?: number
	genre?: string
	songCount?: number
	duration?: number
	coverArt?: string
}

/** Subsonic Artist type */
interface SubsonicArtist {
	id: string
	name?: string
	albumCount?: number
	coverArt?: string
}

/** Subsonic Playlist type */
interface SubsonicPlaylist {
	id: string
	name?: string
	songCount?: number
	duration?: number
	public?: boolean
	owner?: string
	coverArt?: string
}

/** Subsonic search3 result */
interface SubsonicSearchResult {
	artist?: SubsonicArtist[]
	album?: SubsonicAlbum[]
	song?: SubsonicSong[]
}

/** Subsonic starred2 result */
interface SubsonicStarredResult {
	artist?: SubsonicArtist[]
	album?: SubsonicAlbum[]
	song?: SubsonicSong[]
}

// ============================================================================
// Track Mappings
// ============================================================================

/**
 * Map a Subsonic song to a UnifiedTrack.
 */
export function mapSubsonicTrack(song: SubsonicSong): UnifiedTrack {
	return {
		id: song.id,
		name: song.title ?? 'Unknown Track',
		albumId: song.albumId ?? '',
		albumName: song.album ?? '',
		artistId: song.artistId ?? '',
		artistName: song.artist ?? '',
		duration: song.duration ?? 0,
		trackNumber: song.track,
		discNumber: song.discNumber,
		year: song.year,
		genre: song.genre,
		coverArtId: song.coverArt ?? song.albumId ?? song.id,
	}
}

/**
 * Map multiple Subsonic songs.
 */
export function mapSubsonicTracks(songs: SubsonicSong[]): UnifiedTrack[] {
	return songs.map(mapSubsonicTrack)
}

// ============================================================================
// Album Mappings
// ============================================================================

/**
 * Map a Subsonic album to a UnifiedAlbum.
 */
export function mapSubsonicAlbum(album: SubsonicAlbum): UnifiedAlbum {
	return {
		id: album.id,
		name: album.name ?? 'Unknown Album',
		artistId: album.artistId ?? '',
		artistName: album.artist ?? '',
		year: album.year,
		genre: album.genre,
		trackCount: album.songCount,
		duration: album.duration,
		coverArtId: album.coverArt ?? album.id,
	}
}

/**
 * Map multiple Subsonic albums.
 */
export function mapSubsonicAlbums(albums: SubsonicAlbum[]): UnifiedAlbum[] {
	return albums.map(mapSubsonicAlbum)
}

// ============================================================================
// Artist Mappings
// ============================================================================

/**
 * Map a Subsonic artist to a UnifiedArtist.
 */
export function mapSubsonicArtist(artist: SubsonicArtist): UnifiedArtist {
	return {
		id: artist.id,
		name: artist.name ?? 'Unknown Artist',
		albumCount: artist.albumCount,
		coverArtId: artist.coverArt ?? artist.id,
	}
}

/**
 * Map multiple Subsonic artists.
 */
export function mapSubsonicArtists(artists: SubsonicArtist[]): UnifiedArtist[] {
	return artists.map(mapSubsonicArtist)
}

// ============================================================================
// Playlist Mappings
// ============================================================================

/**
 * Map a Subsonic playlist to a UnifiedPlaylist.
 */
export function mapSubsonicPlaylist(playlist: SubsonicPlaylist): UnifiedPlaylist {
	return {
		id: playlist.id,
		name: playlist.name ?? 'Unknown Playlist',
		trackCount: playlist.songCount ?? 0,
		duration: playlist.duration,
		isPublic: playlist.public,
		ownerName: playlist.owner,
		coverArtId: playlist.coverArt ?? playlist.id,
	}
}

/**
 * Map multiple Subsonic playlists.
 */
export function mapSubsonicPlaylists(playlists: SubsonicPlaylist[]): UnifiedPlaylist[] {
	return playlists.map(mapSubsonicPlaylist)
}

// ============================================================================
// Search Result Mappings
// ============================================================================

/**
 * Map Subsonic search3 results to UnifiedSearchResults.
 */
export function mapSubsonicSearchResults(result: SubsonicSearchResult): UnifiedSearchResults {
	return {
		artists: mapSubsonicArtists(result.artist ?? []),
		albums: mapSubsonicAlbums(result.album ?? []),
		tracks: mapSubsonicTracks(result.song ?? []),
		playlists: [], // Subsonic search doesn't include playlists
	}
}

// ============================================================================
// Starred/Favorites Mappings
// ============================================================================

/**
 * Map Subsonic starred2 results to UnifiedStarred.
 */
export function mapSubsonicStarred(result: SubsonicStarredResult): UnifiedStarred {
	return {
		artists: mapSubsonicArtists(result.artist ?? []),
		albums: mapSubsonicAlbums(result.album ?? []),
		tracks: mapSubsonicTracks(result.song ?? []),
	}
}
