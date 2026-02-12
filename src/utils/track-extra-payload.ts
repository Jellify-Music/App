/**
 * Type-safe utilities for accessing extraPayload data from tracks.
 * This module provides helper functions to safely access and type the extraPayload field.
 */

import { TrackExtraPayload, getTrackExtraPayload } from '../types/JellifyTrack'
import {
	NameGuidPair,
	BaseItemDto,
	MediaSourceInfo,
} from '@jellyfin/sdk/lib/generated-client/models'
import { SourceType } from '../types/JellifyTrack'
import { TrackItem } from 'react-native-nitro-player'

export default function getTrackDto(track: TrackItem | undefined): BaseItemDto | undefined {
	const item = JSON.parse(getTrackExtraPayload(track)?.item ?? '{}') as BaseItemDto
	console.debug(item)
	return item
}

export function getTrackMediaSourceInfo(track: TrackItem | undefined): MediaSourceInfo | undefined {
	const mediaSourceInfo = JSON.parse(
		getTrackExtraPayload(track)?.mediaSourceInfo ?? '{}',
	) as MediaSourceInfo
	return mediaSourceInfo
}

/**
 * Get the artist items from a track's extra payload.
 *
 * @param track The track to get artist items from
 * @returns Array of artist items, or undefined if not available
 */
export function getTrackArtists(track: TrackItem | undefined): NameGuidPair[] | undefined {
	const item = JSON.parse(getTrackExtraPayload(track)?.item ?? '{}') as BaseItemDto
	return (item?.ArtistItems ?? item?.ArtistItems) || undefined
}

/**
 * Get the album ID from a track's extra payload.
 *
 * @param track The track to get album ID from
 * @returns The album ID, or undefined if not available
 */
export function getTrackAlbumId(track: TrackItem | undefined): string | undefined {
	const item = JSON.parse(getTrackExtraPayload(track)?.item ?? '{}') as BaseItemDto
	return item?.AlbumId ?? undefined
}

/**
 * Get the album information from a track's extra payload.
 *
 * @param track The track to get album info from
 * @returns Object with album Id and Album name, or undefined if not available
 */
export function getTrackAlbumInfo(track: TrackItem | undefined): NameGuidPair {
	const item = JSON.parse(getTrackExtraPayload(track)?.item ?? '{}') as BaseItemDto
	return {
		Id: item.AlbumId!,
		Name: item.Album,
	}
}

/**
 * Get the source type from a track's extra payload.
 *
 * @param track The track to get source type from
 * @returns The source type ('stream' or 'download'), or undefined if not available
 */
export function getTrackSourceType(track: TrackItem | undefined): SourceType | undefined {
	const payload = getTrackExtraPayload(track)
	return payload?.sourceType
}

/**
 * Get the official rating from a track's extra payload.
 *
 * @param track The track to get rating from
 * @returns The official rating (e.g. "G", "PG", "M"), or undefined if not available
 */
export function getTrackOfficialRating(track: TrackItem | undefined): string | undefined {
	const item = JSON.parse(getTrackExtraPayload(track)?.item ?? '{}') as BaseItemDto
	return item?.OfficialRating ?? undefined
}

/**
 * Get the custom rating from a track's extra payload.
 *
 * @param track The track to get custom rating from
 * @returns The custom rating, or undefined if not available
 */
export function getTrackCustomRating(track: TrackItem | undefined): string | undefined {
	const item = JSON.parse(getTrackExtraPayload(track)?.item ?? '{}') as BaseItemDto
	return item?.CustomRating ?? undefined
}

/**
 * Get both official and custom ratings from a track's extra payload.
 * Prioritizes official rating if available.
 *
 * @param track The track to get ratings from
 * @returns The first available rating (official or custom), or undefined if neither available
 */
export function getTrackRating(track: TrackItem | undefined): string | undefined {
	return getTrackOfficialRating(track) ?? getTrackCustomRating(track)
}

/**
 * Get the extra payload with full type safety.
 *
 * @param track The track to get extra payload from
 * @returns The properly typed extra payload, or undefined if track is undefined
 */
export function getTypedExtraPayload(track: TrackItem | undefined): TrackExtraPayload | undefined {
	return getTrackExtraPayload(track)
}
