import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import getTrackDto, { getTrackItemId } from '../utils/mapping/track-extra-payload'

export type SourceType = 'stream' | 'download'

export type BaseItemDtoSlimified = Pick<
	BaseItemDto,
	| 'Id'
	| 'Name'
	| 'SortName' // @deprecated - use Name instead. Kept for migration of existing downloads.
	| 'AlbumId'
	| 'ArtistItems'
	| 'ImageBlurHashes'
	| 'NormalizationGain'
	| 'RunTimeTicks'
	| 'OfficialRating'
	| 'CustomRating'
	| 'ProductionYear'
>

export type TrackExtraPayload = Record<string, unknown> & {
	/**
	 * The full {@link BaseItemDto} of the track.
	 *
	 * You should use the {@link getTrackDto} function to access this with
	 * type safety (and convenience!)
	 */
	item: string

	/**
	 * The Jellyfin item ID of the track.
	 *
	 * Queued tracks are given a unique `id` per queue entry so the
	 * same track can be queued more than once, so use {@link getTrackItemId}
	 * rather than `track.id` when talking to Jellyfin or the download manager
	 */
	itemId?: string
	sessionId: string

	/**
	 * The full {@link MediaSourceInfo} for the track
	 *
	 * You should use the
	 */
	mediaSourceInfo: string
	blurhash?: string
}

export type SlimifiedBaseItemDto = Pick<
	BaseItemDto,
	| 'Id'
	| 'Name'
	| 'AlbumId'
	| 'Album'
	| 'ArtistItems'
	| 'ImageBlurHashes'
	| 'NormalizationGain'
	| 'RunTimeTicks'
	| 'OfficialRating'
	| 'CustomRating'
	| 'ProductionYear'
	| 'ImageTags'
	| 'Type'
	| 'AlbumPrimaryImageTag'
	| 'ParentId'
	| 'ParentPrimaryImageItemId'
	| 'ParentPrimaryImageTag'
	| 'BackdropImageTags'
	| 'ParentBackdropItemId'
	| 'ParentBackdropImageTags'
>
