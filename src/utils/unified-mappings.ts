/**
 * Unified type mapping utilities for converting between unified types
 * and legacy BaseItemDto for backward compatibility.
 *
 * These utilities enable gradual migration - components can accept unified types
 * and convert internally when interfacing with legacy code paths.
 */

import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import {
	UnifiedItem,
	UnifiedTrack,
	UnifiedAlbum,
	UnifiedArtist,
	UnifiedPlaylist,
	isUnifiedTrack,
	isUnifiedAlbum,
	isUnifiedArtist,
	isUnifiedPlaylist,
} from '../api/core/types'

// ============================================================================
// Conversion Constants
// ============================================================================

/** Ticks per second for Jellyfin runtime conversion */
const TICKS_PER_SECOND = 10_000_000

// ============================================================================
// Unified → BaseItemDto Conversions
// ============================================================================

/**
 * Convert a UnifiedTrack to a BaseItemDto.
 */
export function unifiedTrackToDto(track: UnifiedTrack): BaseItemDto {
	return {
		Id: track.id,
		Name: track.name,
		Type: BaseItemKind.Audio,
		Album: track.albumName,
		AlbumId: track.albumId,
		AlbumArtist: track.artistName,
		Artists: [track.artistName],
		ArtistItems: track.artistId ? [{ Id: track.artistId, Name: track.artistName }] : undefined,
		AlbumArtists: track.artistId ? [{ Id: track.artistId, Name: track.artistName }] : undefined,
		RunTimeTicks: track.duration * TICKS_PER_SECOND,
		IndexNumber: track.trackNumber,
		ParentIndexNumber: track.discNumber,
		ProductionYear: track.year,
		Genres: track.genre ? [track.genre] : undefined,
		NormalizationGain: track.normalizationGain,
		ImageBlurHashes: track.imageBlurHash
			? { Primary: { [track.id]: track.imageBlurHash } }
			: undefined,
	}
}

/**
 * Convert a UnifiedAlbum to a BaseItemDto.
 */
export function unifiedAlbumToDto(album: UnifiedAlbum): BaseItemDto {
	return {
		Id: album.id,
		Name: album.name,
		Type: BaseItemKind.MusicAlbum,
		AlbumArtist: album.artistName,
		AlbumArtists: album.artistId ? [{ Id: album.artistId, Name: album.artistName }] : undefined,
		ProductionYear: album.year,
		Genres: album.genre ? [album.genre] : undefined,
		ChildCount: album.trackCount,
		RunTimeTicks: album.duration ? album.duration * TICKS_PER_SECOND : undefined,
		ImageBlurHashes: album.imageBlurHash
			? { Primary: { [album.id]: album.imageBlurHash } }
			: undefined,
	}
}

/**
 * Convert a UnifiedArtist to a BaseItemDto.
 */
export function unifiedArtistToDto(artist: UnifiedArtist): BaseItemDto {
	return {
		Id: artist.id,
		Name: artist.name,
		Type: BaseItemKind.MusicArtist,
		ChildCount: artist.albumCount,
		Overview: artist.overview,
		ImageBlurHashes: artist.imageBlurHash
			? { Primary: { [artist.id]: artist.imageBlurHash } }
			: undefined,
	}
}

/**
 * Convert a UnifiedPlaylist to a BaseItemDto.
 */
export function unifiedPlaylistToDto(playlist: UnifiedPlaylist): BaseItemDto {
	return {
		Id: playlist.id,
		Name: playlist.name,
		Type: BaseItemKind.Playlist,
		ChildCount: playlist.trackCount,
		RunTimeTicks: playlist.duration ? playlist.duration * TICKS_PER_SECOND : undefined,
		ImageBlurHashes: playlist.imageBlurHash
			? { Primary: { [playlist.id]: playlist.imageBlurHash } }
			: undefined,
	}
}

/**
 * Convert any UnifiedItem to a BaseItemDto.
 * Use this when you need to pass unified types to legacy code.
 */
export function unifiedItemToDto(item: UnifiedItem): BaseItemDto {
	if (isUnifiedTrack(item)) return unifiedTrackToDto(item)
	if (isUnifiedAlbum(item)) return unifiedAlbumToDto(item)
	if (isUnifiedArtist(item)) return unifiedArtistToDto(item)
	if (isUnifiedPlaylist(item)) return unifiedPlaylistToDto(item)

	// Fallback - should never happen with proper typing
	throw new Error('Unknown unified item type')
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the ID from either a UnifiedItem or BaseItemDto.
 */
export function getItemId(item: UnifiedItem | BaseItemDto): string | undefined {
	if ('id' in item) return item.id
	return item.Id
}

/**
 * Get the name from either a UnifiedItem or BaseItemDto.
 */
export function getItemName(item: UnifiedItem | BaseItemDto): string {
	if ('name' in item) return item.name
	return item.Name ?? 'Unknown'
}

/**
 * Get the cover art ID from either a UnifiedItem or BaseItemDto.
 */
export function getItemCoverArtId(item: UnifiedItem | BaseItemDto): string | undefined {
	if ('coverArtId' in item) return item.coverArtId
	// Now TypeScript knows this is a BaseItemDto
	const dto = item as BaseItemDto
	// For BaseItemDto, use AlbumId for tracks, or Id for others
	if (dto.Type === BaseItemKind.Audio) {
		return dto.AlbumId ?? dto.Id
	}
	return dto.Id
}

/**
 * Check if an item is a unified type (has lowercase 'id').
 */
export function isUnifiedItem(item: UnifiedItem | BaseItemDto): item is UnifiedItem {
	return 'id' in item && typeof item.id === 'string'
}

/**
 * Check if an item is a BaseItemDto (has uppercase 'Id').
 */
export function isBaseItemDto(item: UnifiedItem | BaseItemDto): item is BaseItemDto {
	return 'Id' in item
}

/**
 * Normalize an item to ensure consistent handling.
 * Returns the item as-is if already BaseItemDto, converts if UnifiedItem.
 */
export function normalizeToDto(item: UnifiedItem | BaseItemDto): BaseItemDto {
	if (isUnifiedItem(item)) {
		return unifiedItemToDto(item)
	}
	return item
}
