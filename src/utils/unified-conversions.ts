/**
 * Conversion utilities for converting unified types to BaseItemDto for compatibility
 * with existing Jellyfin-oriented components.
 */

import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { UnifiedAlbum, UnifiedArtist, UnifiedTrack } from '../api/core/types'

/**
 * Convert a UnifiedAlbum to a BaseItemDto for compatibility with existing components.
 */
export function unifiedAlbumToBaseItem(album: UnifiedAlbum): BaseItemDto {
	return {
		Id: album.id,
		Name: album.name,
		Type: BaseItemKind.MusicAlbum,
		AlbumArtist: album.artistName,
		AlbumArtists: album.artistId ? [{ Id: album.artistId, Name: album.artistName }] : undefined,
		ProductionYear: album.year,
		Genres: album.genre ? [album.genre] : undefined,
		ChildCount: album.trackCount,
		RunTimeTicks: album.duration ? album.duration * 10_000_000 : undefined,
		// For image loading - set ImageTags if we have a blurHash
		ImageTags: album.imageBlurHash ? { Primary: album.imageBlurHash } : undefined,
		ImageBlurHashes: album.imageBlurHash
			? { Primary: { [album.id]: album.imageBlurHash } }
			: undefined,
	}
}

/**
 * Convert multiple UnifiedAlbums to BaseItemDtos.
 */
export function unifiedAlbumsToBaseItems(albums: UnifiedAlbum[]): BaseItemDto[] {
	return albums.map(unifiedAlbumToBaseItem)
}

/**
 * Convert a UnifiedArtist to a BaseItemDto for compatibility with existing components.
 */
export function unifiedArtistToBaseItem(artist: UnifiedArtist): BaseItemDto {
	return {
		Id: artist.id,
		Name: artist.name,
		Type: BaseItemKind.MusicArtist,
		ChildCount: artist.albumCount,
		Overview: artist.overview,
		ImageTags: artist.imageBlurHash ? { Primary: artist.imageBlurHash } : undefined,
		ImageBlurHashes: artist.imageBlurHash
			? { Primary: { [artist.id]: artist.imageBlurHash } }
			: undefined,
	}
}

/**
 * Convert multiple UnifiedArtists to BaseItemDtos.
 */
export function unifiedArtistsToBaseItems(artists: UnifiedArtist[]): BaseItemDto[] {
	return artists.map(unifiedArtistToBaseItem)
}

/**
 * Convert a UnifiedTrack to a BaseItemDto for compatibility with existing components.
 */
export function unifiedTrackToBaseItem(track: UnifiedTrack): BaseItemDto {
	return {
		Id: track.id,
		Name: track.name,
		Type: BaseItemKind.Audio,
		AlbumId: track.albumId,
		Album: track.albumName,
		Artists: [track.artistName],
		ArtistItems: track.artistId ? [{ Id: track.artistId, Name: track.artistName }] : undefined,
		IndexNumber: track.trackNumber,
		ParentIndexNumber: track.discNumber,
		ProductionYear: track.year,
		Genres: track.genre ? [track.genre] : undefined,
		RunTimeTicks: track.duration * 10_000_000,
		NormalizationGain: track.normalizationGain,
		ImageTags: track.imageBlurHash ? { Primary: track.imageBlurHash } : undefined,
		ImageBlurHashes: track.imageBlurHash
			? { Primary: { [track.id]: track.imageBlurHash } }
			: undefined,
	}
}

/**
 * Convert multiple UnifiedTracks to BaseItemDtos.
 */
export function unifiedTracksToBaseItems(tracks: UnifiedTrack[]): BaseItemDto[] {
	return tracks.map(unifiedTrackToBaseItem)
}
