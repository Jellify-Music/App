/**
 * Type mapping functions for converting between Jellyfin SDK types
 * and unified backend-agnostic types.
 */

import { BaseItemDto, BaseItemKind, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk'
import {
	UnifiedAlbum,
	UnifiedArtist,
	UnifiedPlaylist,
	UnifiedSearchResults,
	UnifiedStarred,
	UnifiedTrack,
} from '../core/types'
import { convertRunTimeTicksToSeconds } from '../../utils/runtimeticks'

// ============================================================================
// Track Mappings
// ============================================================================

/**
 * Map a Jellyfin BaseItemDto (Audio) to a UnifiedTrack.
 */
export function mapJellyfinTrack(item: BaseItemDto): UnifiedTrack {
	return {
		id: item.Id!,
		name: item.Name ?? 'Unknown Track',
		albumId: item.AlbumId ?? '',
		albumName: item.Album ?? '',
		artistId: item.ArtistItems?.[0]?.Id ?? item.AlbumArtists?.[0]?.Id ?? '',
		artistName: item.Artists?.join(' • ') ?? item.AlbumArtist ?? '',
		duration: item.RunTimeTicks ? convertRunTimeTicksToSeconds(item.RunTimeTicks) : 0,
		trackNumber: item.IndexNumber ?? undefined,
		discNumber: item.ParentIndexNumber ?? undefined,
		year: item.ProductionYear ?? undefined,
		genre: item.Genres?.[0],
		coverArtId: item.AlbumId ?? item.Id,
		imageBlurHash: item.ImageBlurHashes?.Primary
			? Object.values(item.ImageBlurHashes.Primary)[0]
			: undefined,
		normalizationGain: item.NormalizationGain ?? undefined,
	}
}

/**
 * Map multiple Jellyfin tracks.
 */
export function mapJellyfinTracks(items: BaseItemDto[]): UnifiedTrack[] {
	return items.map(mapJellyfinTrack)
}

// ============================================================================
// Album Mappings
// ============================================================================

/**
 * Map a Jellyfin BaseItemDto (MusicAlbum) to a UnifiedAlbum.
 */
export function mapJellyfinAlbum(item: BaseItemDto): UnifiedAlbum {
	return {
		id: item.Id!,
		name: item.Name ?? 'Unknown Album',
		artistId: item.AlbumArtists?.[0]?.Id ?? item.ArtistItems?.[0]?.Id ?? '',
		artistName: item.AlbumArtist ?? item.Artists?.join(' • ') ?? '',
		year: item.ProductionYear ?? undefined,
		genre: item.Genres?.[0],
		trackCount: item.ChildCount ?? undefined,
		duration: item.RunTimeTicks ? convertRunTimeTicksToSeconds(item.RunTimeTicks) : undefined,
		coverArtId: item.Id,
		imageBlurHash: item.ImageBlurHashes?.Primary
			? Object.values(item.ImageBlurHashes.Primary)[0]
			: undefined,
	}
}

/**
 * Map multiple Jellyfin albums.
 */
export function mapJellyfinAlbums(items: BaseItemDto[]): UnifiedAlbum[] {
	return items.map(mapJellyfinAlbum)
}

// ============================================================================
// Artist Mappings
// ============================================================================

/**
 * Map a Jellyfin BaseItemDto (MusicArtist) to a UnifiedArtist.
 */
export function mapJellyfinArtist(item: BaseItemDto): UnifiedArtist {
	return {
		id: item.Id!,
		name: item.Name ?? 'Unknown Artist',
		albumCount: item.ChildCount ?? undefined,
		coverArtId: item.Id,
		imageBlurHash: item.ImageBlurHashes?.Primary
			? Object.values(item.ImageBlurHashes.Primary)[0]
			: undefined,
		overview: item.Overview ?? undefined,
	}
}

/**
 * Map multiple Jellyfin artists.
 */
export function mapJellyfinArtists(items: BaseItemDto[]): UnifiedArtist[] {
	return items.map(mapJellyfinArtist)
}

// ============================================================================
// Playlist Mappings
// ============================================================================

/**
 * Map a Jellyfin BaseItemDto (Playlist) to a UnifiedPlaylist.
 */
export function mapJellyfinPlaylist(item: BaseItemDto): UnifiedPlaylist {
	return {
		id: item.Id!,
		name: item.Name ?? 'Unknown Playlist',
		trackCount: item.ChildCount ?? 0,
		duration: item.RunTimeTicks ? convertRunTimeTicksToSeconds(item.RunTimeTicks) : undefined,
		// Note: Jellyfin BaseItemDto doesn't have IsPublic - playlists are private by default
		isPublic: undefined,
		coverArtId: item.Id,
		imageBlurHash: item.ImageBlurHashes?.Primary
			? Object.values(item.ImageBlurHashes.Primary)[0]
			: undefined,
	}
}

/**
 * Map multiple Jellyfin playlists.
 */
export function mapJellyfinPlaylists(items: BaseItemDto[]): UnifiedPlaylist[] {
	return items.map(mapJellyfinPlaylist)
}

// ============================================================================
// Search Result Mappings
// ============================================================================

/**
 * Map Jellyfin search results (mixed types) to UnifiedSearchResults.
 */
export function mapJellyfinSearchResults(items: BaseItemDto[]): UnifiedSearchResults {
	const artists: UnifiedArtist[] = []
	const albums: UnifiedAlbum[] = []
	const tracks: UnifiedTrack[] = []
	const playlists: UnifiedPlaylist[] = []

	for (const item of items) {
		switch (item.Type) {
			case BaseItemKind.MusicArtist:
				artists.push(mapJellyfinArtist(item))
				break
			case BaseItemKind.MusicAlbum:
				albums.push(mapJellyfinAlbum(item))
				break
			case BaseItemKind.Audio:
				tracks.push(mapJellyfinTrack(item))
				break
			case BaseItemKind.Playlist:
				playlists.push(mapJellyfinPlaylist(item))
				break
		}
	}

	return { artists, albums, tracks, playlists }
}

// ============================================================================
// Starred/Favorites Mappings
// ============================================================================

/**
 * Map Jellyfin favorites to UnifiedStarred.
 */
export function mapJellyfinStarred(
	artists: BaseItemDto[],
	albums: BaseItemDto[],
	tracks: BaseItemDto[],
): UnifiedStarred {
	return {
		artists: mapJellyfinArtists(artists),
		albums: mapJellyfinAlbums(albums),
		tracks: mapJellyfinTracks(tracks),
	}
}

// ============================================================================
// URL Builders
// ============================================================================

/**
 * Get the cover art URL for a Jellyfin item.
 */
export function getJellyfinCoverArtUrl(api: Api, id: string, size?: number): string {
	const baseUrl = getImageApi(api).getItemImageUrlById(id, ImageType.Primary)
	if (size) {
		return `${baseUrl}&maxWidth=${size}&maxHeight=${size}`
	}
	return baseUrl
}

/**
 * Get the streaming URL for a Jellyfin track.
 */
export function getJellyfinStreamUrl(api: Api, trackId: string): string {
	return `${api.basePath}/Audio/${trackId}/universal?api_key=${api.accessToken}`
}

/**
 * Get the download URL for a Jellyfin track.
 * Uses the same universal endpoint as streaming.
 */
export function getJellyfinDownloadUrl(api: Api, trackId: string): string {
	return `${api.basePath}/Audio/${trackId}/universal?api_key=${api.accessToken}`
}
