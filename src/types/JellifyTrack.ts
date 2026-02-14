import { TrackItem } from 'react-native-nitro-player'
import { QueuingType } from '../enums/queuing-type'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import getTrackDto from '../utils/mapping/track-extra-payload'

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
	sessionId: string

	/**
	 * The full {@link MediaSourceInfo} for the track
	 *
	 * You should use the
	 */
	mediaSourceInfo: string
}

export type SlimifiedBaseItemDto = Pick<
	BaseItemDto,
	| 'Id'
	| 'Name'
	| 'AlbumId'
	| 'ArtistItems'
	| 'ImageBlurHashes'
	| 'NormalizationGain'
	| 'RunTimeTicks'
	| 'OfficialRating'
	| 'CustomRating'
	| 'ProductionYear'
	| 'ImageTags'
	| 'Type'
>
